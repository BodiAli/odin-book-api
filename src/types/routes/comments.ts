import type {
  comment,
  comments,
  createCommentRequest,
  createReplyRequest,
  createReplyResponse,
  getCommentRepliesResponse,
  updateCommentRequest,
} from "#src/schemas/routes/comments.js";
import type z from "zod";

export type Comment = z.infer<typeof comment>;
export type Comments = z.infer<typeof comments>;

export type CreateCommentRequest = z.infer<typeof createCommentRequest>;

export type UpdateCommentRequest = z.infer<typeof updateCommentRequest>;

export type GetCommentRepliesResponse = z.infer<
  typeof getCommentRepliesResponse
>;

export type CreateReplyRequest = z.infer<typeof createReplyRequest>;
export type CreateReplyResponse = z.infer<typeof createReplyResponse>;
