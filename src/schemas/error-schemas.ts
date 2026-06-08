import { z } from "zod";

export const ClientError = z
  .object({
    errors: z.array(
      z.object({
        message: z.string(),
      }),
    ),
  })
  .openapi("ClientError");

export const ServerError = z
  .object({
    error: z.string(),
  })
  .openapi("ServerError");
