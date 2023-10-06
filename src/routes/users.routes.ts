import express from "express";
import {
  loginController,
  registerController,
} from "~/controllers/users.controllers";
import {
  loginValidator,
  registerValidator,
} from "~/middlewares/users.middlewares";
import { validate } from "~/utils/validation";
const userRouter = express.Router();

userRouter.post("/login", loginValidator, loginController);

userRouter.post("/register", registerValidator, registerController);

export default userRouter;
