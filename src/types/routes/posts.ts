import {
  post,
  createPostRequestBody,
  createPostResponseBody,
  getIndexPostsResponseBody,
  getPostResponseBody,
  updatePostRequestBody,
  getPostCommentsResponse,
  createPostCommentResponse,
} from "#src/schemas/routes/posts.js";
import type z from "zod";

export type Post = z.infer<typeof post>;

export type CreatePostRequestBody = z.infer<typeof createPostRequestBody>;
export type CreatePostResponseBody = z.infer<typeof createPostResponseBody>;

export type GetIndexPostsResponseBody = z.infer<
  typeof getIndexPostsResponseBody
>;

export type GetPostResponseBody = z.infer<typeof getPostResponseBody>;

export type UpdatePostRequestBody = z.infer<typeof updatePostRequestBody>;

export type GetPostCommentsResponse = z.infer<typeof getPostCommentsResponse>;

export type CreatePostCommentResponse = z.infer<
  typeof createPostCommentResponse
>;
