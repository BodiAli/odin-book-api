import z from "zod";
import type { CommentModel } from "#src/generated/prisma/models.js";

export const comment: z.ZodType<CommentModel> = z.object({
  id: z.uuid(),
  content: z.string(),
  userId: z.string(),
  postId: z.string(),
  parentId: z.string(),
  createdAt: z.date(),
});
