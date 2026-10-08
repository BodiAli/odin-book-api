import z from "zod";
import { publicUser } from "./users.js";
import type { PostModel } from "#src/generated/prisma/models.js";
import type { PublicUser } from "#src/types/routes/users.js";

export const post: z.ZodType<PostModel & { author: PublicUser }> = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  imageId: z.string().nullable(),
  imageUrl: z.string().nullable(),
  userId: z.string(),
  createdAt: z.date(),
  author: publicUser,
});

export const createPostRequestBody = z.object({
  title: z
    .string("Please provide a string title.")
    .trim()
    .nonempty("Post title cannot be empty.")
    .max(255, "Post title cannot exceed 255 characters."),
  content: z
    .string("Please provide a string content.")
    .trim()
    .nonempty("Post content cannot be empty."),
});

export const createPostResponseBody = z.object({
  post: post,
});

export const getIndexPostsResponseBody = z.object({
  posts: z.array(post),
  metadata: z.object({
    nextCursorId: z.string().nullable(),
    hasNextPage: z.boolean(),
  }),
});

export const postImage = z
  .object({
    size: z.number().max(5 * 2 ** 20, "File cannot exceed 5MiB."),
    mimetype: z.string().startsWith("image/", "File must be of type image."),
  })
  .optional();

export const getPostResponseBody = z.object({
  post: post,
});
