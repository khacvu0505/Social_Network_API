import express from "express";
import {
  loginController,
  registerController,
} from "~/controllers/users.controllers";
import { loginValidator } from "~/middlewares/users.middlewares";
const userRouter = express.Router();

userRouter.get("/login", loginValidator, loginController);

userRouter.post("/register", registerController);

export default userRouter;
