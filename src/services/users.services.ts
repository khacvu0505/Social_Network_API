import { ObjectId } from 'mongodb';
import { TokenType, UserVerifyStatus } from '~/constants/enum';
import { USERS_MESSAGES } from '~/constants/messages';
import { ChangePasswordRequestBody, RegisterRequestBody, UpdateMeRequestBody } from '~/models/requests/User.requests';
import Follower from '~/models/schemas/Follower.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import { hasPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import axios from 'axios';
import { ErrorWithStatus } from '~/models/Error';
import HTTP_STATUS from '~/constants/httpStatus';

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: {
        algorithm: 'HS256',
        expiresIn: '15m'
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    });
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    });
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken, verify },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    });
  }

  private signForgotVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    });
  }

  // Generate Access and Refresh Token
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hasPassword(payload.password)
      })
    );

    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    });

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        user_id
      })
    );
    return { accessToken, refreshToken };
  }

  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }

  async findUser(email: string) {
    const user = await databaseService.users.findOne({ email });
    return user;
  }

  async login(user_id: string, verify: UserVerifyStatus) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    });
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        user_id: new ObjectId(user_id)
      })
    );
    return { accessToken, refreshToken };
  }

  private async getOAuthgoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-for m-urlencoded'
      }
    });
    return data as {
      access_token: string;
      id_token: string;
    };
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data as {
      id: string;
      email: string;
      verified_email: boolean;
      name: string;
      given_name: string;
      family_name: string;
    };
  }

  async OAuth(code: string) {
    const { access_token, id_token } = await this.getOAuthgoogleToken(code);
    const userInfo = await this.getGoogleUserInfo(access_token, id_token);
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }
    // Kiểm tra email đã được đăng ký chưa
    const user = await this.findUser(userInfo.email);
    // Nếu tồn tại thì cho login vào website
    if (user) {
      const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      });
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          token: refreshToken,
          user_id: new ObjectId(user._id)
        })
      );
      return { accessToken, refreshToken, newUser: 0, verify: user.verify };
    } else {
      // Tạo mới user
      const data = await this.register({
        email: userInfo.email,
        password: userInfo.id,
        confirm_password: userInfo.id,
        date_of_birth: new Date().toISOString(),
        name: userInfo.name
      });
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified };
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({
      token: refresh_token
    });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          // '' => Email is verified
          // jwt => Email is not verified
          email_verify_token: '',
          verify: UserVerifyStatus.Verified
          // This is current time verify email (Option 1)
          // updated_at: new Date(),
        },
        // This is current time update data in mongodb (Option 2)
        $currentDate: {
          updated_at: true
        }
      }
    );
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    });
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        user_id: new ObjectId(user_id)
      })
    );
    return { accessToken, refreshToken };
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });

    // Gia bo gui email
    console.log('Resend verify email token: ', email_verify_token);

    // Update email_verify_token in database
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  async forgotPassword(user_id: string, verify: UserVerifyStatus) {
    const forgot_password_token = await this.signForgotVerifyToken({
      user_id,
      verify
    });
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id.toString())
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    // Send link to email user
    console.log('Forgot password token: ', forgot_password_token);

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    };
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hasPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 }
      }
    );
    return user;
  }

  async updateMe(user_id: string, payload: UpdateMeRequestBody) {
    const _payload = payload.date_of_birth
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : (payload as UpdateMeRequestBody & { date_of_birth?: Date });

    // Chỗ này có 2 methods: updateOne and findOneAndUpdate
    // + updateOne: Chỉ update data
    // + findOneAndUpdate: update data xong thì trả về document luôn
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ..._payload
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 }
      }
    );
    return user.value;
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          createdAt: 0,
          updatedAt: 0
        }
      }
    );
    return user;
  }

  async follow(user_id: string, followed_user_id: string) {
    const isUserFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    if (isUserFollowed) {
      return {
        message: USERS_MESSAGES.FOLLOWED
      };
    }

    await databaseService.followers.insertOne(
      new Follower({
        followed_user_id: new ObjectId(followed_user_id),
        user_id: new ObjectId(user_id)
      })
    );
    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS
    };
  }

  async unFollow(user_id: string, followed_user_id: string) {
    const isUserFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    if (!isUserFollowed) {
      return {
        message: USERS_MESSAGES.FOLLOW_NOT_YET
      };
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    };
  }

  async changePassword(user_id: string, payload: ChangePasswordRequestBody) {
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hasPassword(payload.password)
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 }
      }
    );
    return user.value;
  }
}

const usersService = new UsersService();
export default usersService;
