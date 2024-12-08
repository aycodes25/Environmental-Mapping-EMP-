import { Request, Response, NextFunction, RequestHandler } from "express";

export default function validationMiddleware(
  schema: any,
  type?: string
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const validationOptions = {
      aboutEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    try {
      let value: any;

      if (type && type.toLowerCase() === "query") {
        value = await schema.validateAsync(req.query, validationOptions);
        req.query = value;
      } else {
        value = await schema.validateAsync(req.body, validationOptions);

        req.body = value;
      }

      next();
    } catch (error: any) {
      const errors: string[] = [];

      error.details.forEach((error: any) => {
        errors.push(error.message);
      });

      res.status(400).json({
        status: "error",
        errors,
      });
    }
  };
}
