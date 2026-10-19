import assert from "node:assert";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type {
  CreateReplyRequest,
  CreateReplyResponse,
  GetCommentRepliesResponse,
  UpdateCommentRequest,
} from "#src/types/routes/comments.js";
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

export async function getCommentReplies(
  req: Request<
    { commentId: string },
    unknown,
    unknown,
    { last_cursor_id?: string }
  >,
  res: Response<GetCommentRepliesResponse | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;

  try {
    const result = await commentQueries.getCommentsInPost({
      type: "replies",
      parentCommentId: commentId,
      ...(req.query.last_cursor_id && {
        lastCursorId: req.query.last_cursor_id,
      }),
    });

    res.json({ replies: result.comments, metadata: result.metadata });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function createReply(
  req: Request<{ commentId: string }, unknown, CreateReplyRequest>,
  res: Response<ClientError | CreateReplyResponse>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;
  const { content, postId } = req.body;

  try {
    const { id } = await commentQueries.createReply({
      userId: req.user.id,
      parentId: commentId,
      postId,
      content,
    });

    res.status(201).json({ id });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
