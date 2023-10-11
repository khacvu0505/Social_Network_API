import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { RegisterRequestBody } from '~/models/requests/User.requests';
import usersService from '~/services/users.services';

export const loginController = async (req: Request, res: Response) => {
  const { user }: any = req;
  const user_id = user._id;
  const result = await usersService.login(user_id.toString());
  return res.status(200).json({
    message: 'Login Successfully',
    result
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersService.register(req.body);
  return res.status(200).json({
    message: 'Register Successfully',
    result
  });
};
