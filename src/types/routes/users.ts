import type {
  followersResponse,
  followingsResponse,
  publicUser,
  user,
} from "#src/schemas/routes/users.js";
import type { z } from "zod";

export type User = z.infer<typeof user>;
export type PublicUser = z.infer<typeof publicUser>;

export type FollowersResponse = z.infer<typeof followersResponse>;
export type FollowingsResponse = z.infer<typeof followingsResponse>;
