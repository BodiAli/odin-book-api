import { ZodError, type z } from "zod";
import type { ClientError } from "#src/schemas/error-schemas.js";
import type { NextFunction, Request, Response } from "express";

export default function validateBody(zodSchema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      zodSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorObject: ClientError = {
          errors: error.issues.map((error) => {
            return {
              message: error.message,
            };
          }),
        };
        res.status(400).json(errorObject);
      }
      next(error);
    }
  };
}
