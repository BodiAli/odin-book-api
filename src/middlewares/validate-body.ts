import type { ClientError } from "#src/schemas/error-schemas.js";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export default function validateBody(zodSchema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = zodSchema.safeParse(req.body);
    if (result.error) {
      const errorObject: ClientError = {
        errors: result.error.issues.map((error) => {
          return {
            message: error.message,
          };
        }),
      };
      res.status(400).json(errorObject);
      return;
    }

    next();
  };
}
