import { TokenType } from "~/constants/enum";
import { RegisterRequestBody } from "~/models/requests/User.requests";
import User from "~/models/schemas/User.schema";
import databaseService from "~/services/database.services";
import { hasPassword } from "~/utils/crypto";
import { signToken } from "~/utils/jwt";

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: {
        algorithm: "HS256",
        expiresIn: "15m",
      },
    });
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: {
        algorithm: "HS256",
        expiresIn: "7d",
      },
    });
  }
  async register(payload: RegisterRequestBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hasPassword(payload.password),
      })
    );
    const userId = result.insertedId.toString();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId),
      this.signRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }
  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }
}

const usersService = new UsersService();
export default usersService;
