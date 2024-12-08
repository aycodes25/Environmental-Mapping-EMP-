import { Request, Response, NextFunction } from "express";

export function Error404Middleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    status: "error",
    message: "You just hit a resource that does not exist",
  });
}
