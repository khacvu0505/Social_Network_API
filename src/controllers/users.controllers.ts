import { Request, Response } from "express";
import usersService from "~/services/users.services";

export const loginController = (req: Request, res: Response) => {
  res.status(200).json("user Router1234");
};

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await usersService.register({ email, password });
    return res.status(200).json({
      message: "Register Successfully",
      result,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(400).json({
      message: "Register Failed ",
    });
  }
};
