import type { ClientError } from "#src/types/errors/errors.js";
import type { NextFunction, Request, Response } from "express";

export default function validateContentType(
  req: Request,
  res: Response<ClientError>,
  next: NextFunction,
): void {
  if (req.is("application/json") === false) {
    res.status(415).json({
      errors: [
        { message: "Server only supports application/json media type." },
      ],
    });
    return;
  }
  next();
}
