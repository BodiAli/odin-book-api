import type { comment, comments } from "#src/schemas/routes/comments.js";
import type z from "zod";

export type Comment = z.infer<typeof comment>;
export type Comments = z.infer<typeof comments>;
