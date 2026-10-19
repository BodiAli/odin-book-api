import z from "zod";
import type { CommentModel } from "#src/generated/prisma/models.js";

export const comment = z.object({
  id: z.uuid(),
  content: z.string(),
  userId: z.string(),
  postId: z.string(),
  parentId: z.string().nullable(),
  createdAt: z.date(),
}) satisfies z.ZodType<CommentModel>;

export const comments = z.array(
  comment.extend({
    hasReplies: z.boolean(),
  }),
);

export const createCommentRequest = z.object({
  content: z
    .string("Please provide a string content.")
    .trim()
    .nonempty("Comment content cannot be empty."),
});

export const updateCommentRequest = createCommentRequest;
