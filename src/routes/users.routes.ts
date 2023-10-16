import express from 'express';
import {
  loginController,
  registerController,
  logoutController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  verifyEmailTokenController
} from '~/controllers/users.controllers';
import {
  accessTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyEmailTokenValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const userRouter = express.Router();

/**
 * 
  Description: Login
  Path:'/login'
  Method: Post
  Body:{ email:string, password:string }
 */
userRouter.post('/login', loginValidator, wrapRequestHandler(loginController));

/**
 * 
  Description: Register
  Path:'/register'
  Method: Post
  Body:{ email:string, password:string, confirm_password:string, date_of_birth:Date }
 */
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

/**
 * 
  Description: Logout
  Path:'/logout'
  Method: Post
  Header: Authorization: Bearer <access_token>
  Body:{refresh_token: string}
 */
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));

/**
 * 
  Description: Verify email when user click on the link in email
  Path:'/verify-email'
  Method: Post
  Body:{ email_verify_token: string }
 */
userRouter.post('/verify-email', verifyEmailTokenValidator, wrapRequestHandler(verifyEmailTokenController));

/**
 * 
  Description: Verify email when user click on the link in email
  Path:'/resend-verify-email'
  Method: Post
  Header: Authorization: Bearer <access_token>
  Body:{ }
 */
userRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));

/**
 * 
  Description: Submit email to reset password
  Path:'/forgot-password'
  Method: Post
  Body:{ }
 */
userRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));

/**
 * 
  Description: Verify link in email to reset password
  Path:/verify-forgot-password
  Method: Post
  Body:{ forgot_password_token:string }
 */
userRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
);

/**
 * 
  Description: Reset password
  Path:/reset-password
  Method: Post
  Body:{ forgot_password_token:string, password: string, confirm_password: string }
 */
userRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController));

export default userRouter;
