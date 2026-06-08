import { z } from "zod";
import type { UserModel } from "#src/generated/prisma/models.js";

export const UserSchema: z.ZodType<Omit<UserModel, "password">> = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string(),
  fullName: z.string(),
});
