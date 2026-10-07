import assert from "node:assert";
import * as postQueries from "#src/queries/post-queries.js";
import type {
  CreatePostRequestBody,
  CreatePostResponseBody,
} from "#src/types/routes/posts.js";
import type { Request, Response } from "express";

export async function createPost(
  req: Request<unknown, unknown, CreatePostRequestBody>,
  res: Response<CreatePostResponseBody>,
): Promise<void> {
  const { title, content } = req.body;
  assert(req.user, "User not found.");

  const post = await postQueries.createPost({
    userId: req.user.id,
    content,
    title,
    imageId: null,
    imageUrl: null,
  });

  res.status(201).json({ post });
}
