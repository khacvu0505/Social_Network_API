import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Error';
import { verifyToken } from './jwt';
import { Request } from 'express';
import { envConfig } from '~/constants/config';

export const numberEnumToArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number');
};

export const verifyAccessToken = (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  try {
    const decoded = verifyToken({
      token: access_token,
      secretKey: envConfig.JWT_SECRET_ACCESS_TOKEN
    });
    if (req) {
      (req as Request).decoded_authorization = decoded;
    }
  } catch (error) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_INVALID,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
};
