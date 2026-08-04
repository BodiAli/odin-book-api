import assert from "node:assert";
import type { NextFunction, Request, Response } from "express";
import type { ClientError } from "#src/types/errors.js";

export default function unauthorizeGuest(
  req: Request,
  res: Response<ClientError>,
  next: NextFunction,
) {
  assert(req.user, "User not found");

  if (req.user.isGuest) {
    res.status(403).json({
      errors: [
        { message: "You must register an account to complete this request." },
      ],
    });
    return;
  }

  next();
}
