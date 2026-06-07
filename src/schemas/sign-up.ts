import { z } from "zod";
import { UserSchema } from "./user-schema.js";

export const RequestBody = z
  .object({
    email: z.email(),
  })
  .openapi("SignUpRequestBody");

export const ResponseBody = z
  .object({
    token: z.jwt(),
    user: UserSchema,
  })
  .openapi("SignUpResponseBody");
