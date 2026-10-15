import type { comment } from "#src/schemas/routes/comments.js";
import type z from "zod";

export type Comment = z.infer<typeof comment>;
