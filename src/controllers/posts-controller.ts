import assert from "node:assert";
import * as postQueries from "#src/queries/post-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import uploadImage from "#src/services/upload-image.js";
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

  let imageUrl: string | null = null;
  let imageId: string | null = null;

  if (req.file) {
    const uploadResult = await uploadImage(req.file.buffer);
    imageUrl = uploadResult.imageUrl;
    imageId = uploadResult.imageId;
  }

  const post = await postQueries.createPost({
    userId: req.user.id,
    content,
    title,
    imageId,
    imageUrl,
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
