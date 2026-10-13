import type { ClientError } from "#src/types/errors/errors.js";
import type { NextFunction, Request, Response } from "express";

export default function validateContentType(
  req: Request,
  res: Response<ClientError>,
  next: NextFunction,
): void {
  if (
    req.is("application/json") === false &&
    req.is("multipart/form-data") === false
  ) {
    res.status(415).json({
      errors: [
        {
          message:
            "Server only supports application/json or multipart/form-data media types.",
        },
      ],
    });
    return;
  }
  next();
}
