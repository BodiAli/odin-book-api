import z from "zod";
import type { NextFunction, Request, Response } from "express";
import type { ClientError } from "#src/types/errors/errors.js";

export default function validateFile(zodSchema: z.ZodObject) {
  return (
    req: Request,
    res: Response<ClientError>,
    next: NextFunction,
  ): void => {
    try {
      zodSchema.parse(req.file);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorObject: ClientError = {
          errors: error.issues.map((error) => {
            return {
              message: error.message,
            };
          }),
        };
        res.status(400).json(errorObject);
        return;
      }
      next(error);
    }
  };
}
