import { Request, Response, NextFunction } from "express";
export const loginValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body;
  console.log("data", username, password);
  next();
};
