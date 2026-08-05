import assert from "node:assert";
import * as followersQueries from "#src/queries/followers-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { NextFunction, Request, Response } from "express";
import type { ClientError } from "#src/types/errors.js";

export async function createFollowerForTargetUser(
  req: Request<{ userId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
) {
  assert(req.user, "User not found");
  const { userId } = req.params;

  try {
    await followersQueries.followUser(req.user.id, userId);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
