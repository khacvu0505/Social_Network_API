import express from 'express';
import { loginController, registerController, logoutController } from '~/controllers/users.controllers';
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const userRouter = express.Router();

/**
 * 
  Description: Login
  Path:'/login'
  Method: Post
  Body:{email:string,password:string}
 */
userRouter.post('/login', loginValidator, wrapRequestHandler(loginController));

/**
 * 
  Description: Register
  Path:'/register'
  Method: Post
  Body:{email:string,password:string,confirm_password:string,date_of_birth:Date}
 */
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

/**
 * 
  Description: Logout
  Path:'/logout'
  Method: Post
  Header: Authorization: Bearer access_token
  Body:{refresh_token:string}
 */
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));

export default userRouter;
