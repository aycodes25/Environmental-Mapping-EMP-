import { Request, Response, NextFunction } from "express";

export function ErrorMiddleWare(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  res.json({
    status: "error",
    message,
  });
}
