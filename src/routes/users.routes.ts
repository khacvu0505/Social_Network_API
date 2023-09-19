import express from "express";
import {
  loginController,
  registerController,
} from "~/controllers/users.controllers";
import { loginValidator } from "~/middlewares/users.middlewares";
const userRouter = express.Router();

userRouter.post("/login", loginValidator, loginController);

userRouter.post("/register", registerController);

export default userRouter;
