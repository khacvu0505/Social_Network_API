import { Request, Response, NextFunction } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';
import omit from 'lodash/omit';
import { ErrorWithStatus } from '~/models/Error';

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      return res.status(err.status).json(omit(err, ['status']));
    }
    const finalError: any = {};
    Object.getOwnPropertyNames(err).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.enumerable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable
      ) {
        return;
      }
      finalError[key] = err[key];
    });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: finalError.message,
      errorInfo: omit(finalError, ['stack'])
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Interal server error'
    });
  }
};
