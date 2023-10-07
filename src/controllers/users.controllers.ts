import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { RegisterRequestBody } from "~/models/requests/User.requests";
import usersService from "~/services/users.services";

export const loginController = (req: Request, res: Response) => {
  res.status(200).json("user Router1234");
};

export const registerController = async (
  req: Request<ParamsDictionary, {}, RegisterRequestBody>,
  res: Response
) => {
  try {
    const result = await usersService.register(req.body);
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
