import assert from "node:assert";
import * as postQueries from "#src/queries/post-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import * as likeQueries from "#src/queries/like-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import uploadImage from "#src/services/upload-image.js";
import type {
  CreatePostCommentResponse,
  CreatePostRequestBody,
  CreatePostResponseBody,
  GetIndexPostsResponseBody,
  GetPostCommentsResponse,
  GetPostResponseBody,
  UpdatePostRequestBody,
} from "#src/types/routes/posts.js";
import type { NextFunction, Request, Response } from "express";
import type { ClientError } from "#src/types/errors/errors.js";
import type { CreateCommentRequest } from "#src/types/routes/comments.js";

export async function createPost(
  req: Request<unknown, unknown, CreatePostRequestBody>,
  res: Response<CreatePostResponseBody | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");
  const { title, content } = req.body;

  let imageUrl: string | null = null;
  let imageId: string | null = null;

  try {
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

    res.location(`/posts/${post.id}`);
    res.status(201).json({ id: post.id });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
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

export async function getPost(
  req: Request<{ postId: string }>,
  res: Response<GetPostResponseBody | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user);
  const { postId } = req.params;

  try {
    const post = await postQueries.getPost(postId);
    res.json({ post });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function updatePost(
  req: Request<{ postId: string }, unknown, UpdatePostRequestBody>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found");

  const { postId } = req.params;

  try {
    if (req.file) {
      const post = await postQueries.getPost(postId);
      if (post.imageId === null) {
        await uploadImage(req.file.buffer);
      } else {
        await uploadImage(req.file.buffer, post.imageId);
      }
    }

    await postQueries.updatePost(req.user.id, postId, {
      ...req.body,
    });

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function deletePost(
  req: Request<{ postId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { postId } = req.params;

  try {
    await postQueries.deletePost(req.user.id, postId);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function getPostComments(
  req: Request<
    { postId: string },
    unknown,
    unknown,
    { last_cursor_id?: string }
  >,
  res: Response<GetPostCommentsResponse | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { postId } = req.params;

  try {
    const result = await commentQueries.getCommentsInPost({
      type: "comments",
      postId,
      ...(req.query.last_cursor_id && {
        lastCursorId: req.query.last_cursor_id,
      }),
    });

    res.json(result);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function createPostComment(
  req: Request<{ postId: string }, unknown, CreateCommentRequest>,
  res: Response<CreatePostCommentResponse | ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { postId } = req.params;
  const { content } = req.body;

  try {
    const { id } = await commentQueries.createComment({
      userId: req.user.id,
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

export async function createPostLike(
  req: Request<{ postId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { postId } = req.params;
  try {
    await likeQueries.createPostLike(req.user.id, postId);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function deletePostLike(
  req: Request<{ postId: string }>,
  res: Response<ClientError>,
  next: NextFunction,
): Promise<void> {
  assert(req.user, "User not found.");

  const { postId } = req.params;

  try {
    await likeQueries.deletePostLike(req.user.id, postId);

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}
