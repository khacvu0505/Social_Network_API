import { ObjectId } from 'mongodb';
import { TokenType, UserVerifyStatus } from '~/constants/enum';
import { USERS_MESSAGES } from '~/constants/messages';
import { RegisterRequestBody } from '~/models/requests/User.requests';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import { hasPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: {
        algorithm: 'HS256',
        expiresIn: '15m'
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    });
  }

  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    });
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
    });
  }

  private signForgotVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    });
  }

  // Generate Access and Refresh Token
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId();
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString());

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hasPassword(payload.password)
      })
    );

    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id.toString());

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

  async login(user_id: string) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        user_id: new ObjectId(user_id)
      })
    );
    return { accessToken, refreshToken };
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
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id);
    return { accessToken, refreshToken };
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id);

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

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotVerifyToken(user_id);
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
}

const usersService = new UsersService();
export default usersService;
