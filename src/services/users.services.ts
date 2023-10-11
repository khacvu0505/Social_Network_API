import { TokenType } from '~/constants/enum';
import { RegisterRequestBody } from '~/models/requests/User.requests';
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
      }
    });
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: {
        algorithm: 'HS256',
        expiresIn: '7d'
      }
    });
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  async register(payload: RegisterRequestBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hasPassword(payload.password)
      })
    );
    const userId = result.insertedId.toString();
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(userId);

    return { accessToken, refreshToken };
  }
  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }
  async login(user_id: string) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id);
    return { accessToken, refreshToken };
  }
}

const usersService = new UsersService();
export default usersService;
