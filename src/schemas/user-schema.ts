import { z } from "zod";
import type { UserModel } from "#src/generated/prisma/models.js";

const UserSchema: z.ZodType<UserModel> = z
  .object({
    id: z.uuid(),
    email: z.email(),
  })
  .openapi("UserSchema");

export { UserSchema };
