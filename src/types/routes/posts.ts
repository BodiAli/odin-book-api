import {
  post,
  createPostRequestBody,
  createPostResponseBody,
  getIndexPostsResponseBody,
  getPostResponseBody,
} from "#src/schemas/routes/posts.js";
import type z from "zod";

export type Post = z.infer<typeof post>;

export type CreatePostRequestBody = z.infer<typeof createPostRequestBody>;
export type CreatePostResponseBody = z.infer<typeof createPostResponseBody>;

export type GetIndexPostsResponseBody = z.infer<
  typeof getIndexPostsResponseBody
>;

export type GetPostResponseBody = z.infer<typeof getPostResponseBody>;
