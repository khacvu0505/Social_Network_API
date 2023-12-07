import express from 'express';
import {
  loginController,
  registerController,
  logoutController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  verifyEmailTokenController,
  getMeController,
  updateMeController,
  getProfileController,
  followController,
  OAuthController,
  unFollowController,
  changePasswordController,
  refreshTokenController
} from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unFollowValidator,
  updateMeValidator,
  verifyEmailTokenValidator,
  verifyForgotPasswordTokenValidator,
  verifyUserValidator
} from '~/middlewares/users.middlewares';
import { UpdateMeRequestBody } from '~/models/requests/User.requests';
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
  Description: OAuth with Google
  Path:'/oauth/google'
  Method: get
 */
userRouter.get('/oauth/google', wrapRequestHandler(OAuthController));

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
  Description: Refresh Token
  Path:'/refresh-token'
  Method: Post
  Body:{ refresh_token: string }
 */
userRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController));

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

/**
 * 
  Description: Get me profile
  Path:/me
  Method: GET
  Header: Beearer <access_token>
 */
userRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

/**
 * 
  Description: Update me profile
  Path:/me
  Method: PATCH
  Header: Bearer <access_token>
  Body: UserSchema
 */
userRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  // This is middleware to get correct params from body
  filterMiddleware<UpdateMeRequestBody>([
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'username',
    'website'
  ]),
  wrapRequestHandler(updateMeController)
);

/**
 * 
  Description: Get user profile
  Path:/:username
  Method: GET
 */
userRouter.get('/:username', wrapRequestHandler(getProfileController));

/**
 * 
  Description: Follow someone
  Path:/follow
  Method: POST
  Header: Bearer <access_token>
  Body: {user_id: string}
 */
userRouter.post(
  '/follow',
  accessTokenValidator,
  verifyUserValidator,
  followValidator,
  wrapRequestHandler(followController)
);

/**
 * 
  Description: UnFollow someone
  Path:/follow/user_id
  Method: DELLETE
  Header: Bearer <access_token>
 */
userRouter.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifyUserValidator,
  unFollowValidator,
  wrapRequestHandler(unFollowController)
);

/**
 * 
  Description: Change Password
  Path:/change-password
  Method: put
  Header: Bearer <access_token>
 */
userRouter.put(
  '/change-password',
  accessTokenValidator,
  verifyUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
);

export default userRouter;
