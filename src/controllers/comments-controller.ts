import assert from "node:assert";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import * as likeQueries from "#src/queries/like-queries.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import AppEmitter from "#src/events/app-emitter.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type {
  CreateReplyRequest,
  CreateReplyResponse,
  GetCommentRepliesResponse,
  GetCommentResponse,
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
      userId: req.user.id,
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

    const commentAuthorId = await commentQueries.getCommentAuthorId(commentId);
    if (commentAuthorId !== req.user.id) {
      const notification = await notificationQueries.createNotification({
        actorId: req.user.id,
        notifierId: commentAuthorId,
        type: "REPLY",
        commentId: id,
      });
      const appEmitter = AppEmitter.getInstance();
      appEmitter.emitNotification(commentAuthorId, notification.id);
    }

    res.status(201).json({ id });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function createCommentLike(
  req: Request<{ commentId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;

  try {
    await likeQueries.createCommentLike(req.user.id, commentId);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function deleteCommentLike(
  req: Request<{ commentId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;

  try {
    await likeQueries.deleteCommentLike(req.user.id, commentId);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function getComment(
  req: Request<{ commentId: string }>,
  res: Response<ClientError | GetCommentResponse>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { commentId } = req.params;

  try {
    const comment = await commentQueries.getComment(req.user.id, commentId);

    res.json({ comment });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
