import { z } from "zod";

export const ClientError = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
    }),
  ),
});

export const ServerError = z.object({
  error: z.string(),
});
