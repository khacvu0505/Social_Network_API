import express from 'express';
import { loginController, registerController } from '~/controllers/users.controllers';
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const userRouter = express.Router();

userRouter.post('/login', loginValidator, loginController);

userRouter.post('/register', registerValidator, wrapRequestHandler(registerController));

export default userRouter;
