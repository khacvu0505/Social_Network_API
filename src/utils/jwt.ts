import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenPayload } from '~/models/requests/User.requests';

dotenv.config();

export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object;
  privateKey?: string;
  options?: SignOptions;
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        throw reject(error);
      }
      resolve(token as string);
    });
  });
};

export const verifyToken = ({
  token,
  secretKey = process.env.JWT_SECRET
}: {
  token: string;
  secretKey?: string;
}): TokenPayload => {
  const decoded = jwt.verify(token, secretKey as string) as TokenPayload;

  return decoded;
};
