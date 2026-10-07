import assert from "node:assert";
import * as postQueries from "#src/queries/post-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type {
  CreatePostRequestBody,
  CreatePostResponseBody,
  GetIndexPostsResponseBody,
} from "#src/types/routes/posts.js";
import type { NextFunction, Request, Response } from "express";
import type { ClientError } from "#src/types/errors/errors.js";

export async function createPost(
  req: Request<unknown, unknown, CreatePostRequestBody>,
  res: Response<CreatePostResponseBody>,
): Promise<void> {
  assert(req.user, "User not found.");
  const { title, content } = req.body;

  const post = await postQueries.createPost({
    userId: req.user.id,
    content,
    title,
    imageId: null,
    imageUrl: null,
  });

  res.status(201).json({ post });
}

export async function getIndexPosts(
  req: Request<unknown, unknown, unknown, { last_cursor_id?: string }>,
  res: Response<GetIndexPostsResponseBody | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found");
  try {
    const result = await postQueries.getIndexPosts(
      req.user.id,
      req.query.last_cursor_id,
    );
    res.json(result);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
