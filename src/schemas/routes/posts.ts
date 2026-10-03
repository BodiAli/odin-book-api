import z from "zod";
import type { PostModel } from "#src/generated/prisma/models.js";

export const post: z.ZodType<PostModel> = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  imageId: z.string().nullable(),
  imageUrl: z.string().nullable(),
  userId: z.string(),
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
