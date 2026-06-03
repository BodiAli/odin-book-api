import { z } from "zod";
import { UserSchema } from "./user-schema.js";

const RequestBody = z
  .object({
    email: z.email(),
  })
  .openapi("SignUpRequestBody");

const ResponseBody = z
  .object({
    token: z.jwt(),
    user: UserSchema,
  })
  .openapi("SignUpResponseBody");

export { RequestBody, ResponseBody };
