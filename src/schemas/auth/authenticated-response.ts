import { z } from "zod";
import { user } from "../users/user-schema.js";

export const authenticatedResponse = z.object({
  token: z.string(),
  user: user,
});

export type AuthenticatedResponse = z.infer<typeof authenticatedResponse>;
