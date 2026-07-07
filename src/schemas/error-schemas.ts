import { z } from "zod";

export const clientError = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
    }),
  ),
});
export const serverError = z.object({
  error: z.string(),
});
