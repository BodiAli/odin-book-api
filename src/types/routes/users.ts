import type {
  followersResponse,
  publicUser,
  user,
} from "#src/schemas/routes/users.js";
import type { z } from "zod";

export type User = z.infer<typeof user>;
export type PublicUser = z.infer<typeof publicUser>;

export type FollowersResponse = z.infer<typeof followersResponse>;
