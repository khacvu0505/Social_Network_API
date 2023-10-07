import { Request, Response, NextFunction, RequestHandler } from 'express';
// Wrap async function to forward error(if any) to error handler(Use this instead of try/catch each function)
export const wrapRequestHandler = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
