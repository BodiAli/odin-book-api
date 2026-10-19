import assert from "node:assert";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { UpdateCommentRequest } from "#src/types/routes/comments.js";
import type { NextFunction, Request, Response } from "express";

export async function updateComment(
  req: Request<{ commentId: string }, unknown, UpdateCommentRequest>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;
  const { content } = req.body;

  try {
    await commentQueries.updateComment(commentId, content);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function deleteComment(
  req: Request<{ commentId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;

  try {
    await commentQueries.deleteComment(commentId);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
