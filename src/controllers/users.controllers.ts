import { Request, Response } from "express";
import databaseService from "~/services/database.services";

export const loginController = (req: Request, res: Response) => {
  res.status(200).json("user Router1234");
};
export const registerController = (req: Request, res: Response) => {
  const { emai, password } = req.body;
  databaseService.users.insertOne({
    email,
    password,
  });
};
