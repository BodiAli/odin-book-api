import * as errorSchemas from "#src/schemas/error-schemas.js";
import type { Request, Response } from "express";
import type { z } from "zod";

export default function validateBody(zodSchema: z.ZodType) {
  return (req: Request, res: Response) => {
    console.log(req.body);

    const result = zodSchema.safeParse(req.body);
    if (result.error) {
      const errorObject: z.infer<(typeof errorSchemas)["ClientError"]> = {
        errors: result.error.issues.map((error) => {
          return {
            message: error.message,
          };
        }),
      };
      res.status(400).json(errorObject);
    }

    res.sendStatus(400);
  };
}
