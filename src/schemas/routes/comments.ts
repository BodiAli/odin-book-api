import z from "zod";
import { publicUser } from "./users.js";
import type { CommentModel } from "#src/generated/prisma/models.js";
import type { PublicUser } from "#src/types/routes/users.js";

export const comment = z.object({
  id: z.uuid(),
  content: z.string(),
  userId: z.string(),
  postId: z.string(),
  parentId: z.string().nullable(),
  createdAt: z.date(),
  likes: z.number(),
  isLiked: z.boolean(),
  author: publicUser,
}) satisfies z.ZodType<
  CommentModel & { likes: number; isLiked: boolean; author: PublicUser }
>;

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

export const getCommentRepliesResponse = z.object({
  replies: comments,
  metadata: z.object({
    nextCursorId: z.string().nullable(),
  }),
});

export const createReplyRequest = createCommentRequest.extend({
  postId: z
    .string("Please provide a string post ID.")
    .trim()
    .nonempty("Post ID cannot be empty."),
});
export const createReplyResponse = z.object({
  id: z.string(),
});
