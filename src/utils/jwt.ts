import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '~/models/requests/User.requests';

export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object;
  privateKey: string;
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

export const verifyToken = ({ token, secretKey }: { token: string; secretKey: string }): TokenPayload => {
  const decoded = jwt.verify(token, secretKey as string) as TokenPayload;

  return decoded;
};
