import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enum';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Error';
import {
  ChangePasswordRequestBody,
  FollowRequestBody,
  ForgotPasswordRequestBody,
  GetProfileRequestParams,
  LoginRequestBody,
  LogoutRequestBody,
  RefreshTokenRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UnFollowRequestParams,
  UpdateMeRequestBody,
  VerifyEmailRequestBody,
  VerifyForgotPasswordRequestBody
} from '~/models/requests/User.requests';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';
import { envConfig } from '~/constants/config';

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await usersService.login(user_id.toString(), user.verify);
  return res.status(200).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersService.register(req.body);
  return res.status(200).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutRequestBody>, res: Response) => {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);
  return res.status(200).json(result);
};

export const verifyEmailTokenController = async (
  req: Request<ParamsDictionary, any, VerifyEmailRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token;

  // This case is email is not verified
  const result = await usersService.verifyEmail(user_id);
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  });
};

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  // User not found
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
  }

  // User is verified
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
  }

  const result = await usersService.resendVerifyEmail(user_id, user.email);
  return res.status(HTTP_STATUS.OK).json(result);
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const user = req.user as User;

  const result = await usersService.forgotPassword(user._id.toString(), user.verify, user.email);
  return res.status(HTTP_STATUS.OK).json(result);
};

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordRequestBody>,
  res: Response
) => {
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  });
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload;
  const { password } = req.body;

  const result = await usersService.resetPassword(user_id, password);
  return res.status(HTTP_STATUS.OK).json(result);
};

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await usersService.getMe(user_id);
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  });
};

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;

  const dataRequest = req.body;

  const user = await usersService.updateMe(user_id, dataRequest);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  });
};

export const getProfileController = async (req: Request<GetProfileRequestParams>, res: Response) => {
  const { username } = req.params;

  const user = await usersService.getProfile(username);
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  });
};

export const followController = async (req: Request<ParamsDictionary, any, FollowRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;

  const { followed_user_id } = req.body;

  const result = await usersService.follow(user_id, followed_user_id);

  return res.status(HTTP_STATUS.OK).json(result);
};

export const OAuthController = async (req: Request, res: Response) => {
  const { code } = req.query;
  const result = await usersService.OAuth(code as string);
  const urlRedirect = `${envConfig.CLIENT_REDIRECT_CALLBACK}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&newUser=${result.newUser}&verify=${result.verify}`;

  return res.redirect(urlRedirect as string);
};

export const unFollowController = async (req: Request<UnFollowRequestParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;

  const { user_id: followed_user_id } = req.params;

  const result = await usersService.unFollow(user_id, followed_user_id);

  return res.status(HTTP_STATUS.OK).json(result);
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const dataUpdate = req.body;

  const result = await usersService.changePassword(user_id, dataUpdate);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS,
    result
  });
};

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenRequestBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload;
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp });
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  });
};
