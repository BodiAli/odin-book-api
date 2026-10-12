import type {
  createUserRequestBody,
  followersResponse,
  followingsResponse,
  publicUser,
  user,
  getCurrentUserResponse,
} from "#src/schemas/routes/users.js";
import type { z } from "zod";

export type CreateUserRequestBody = z.infer<typeof createUserRequestBody>;

export type User = z.infer<typeof user>;
export type PublicUser = z.infer<typeof publicUser>;

export type GetCurrentUserResponse = z.infer<typeof getCurrentUserResponse>;

export type FollowersResponse = z.infer<typeof followersResponse>;
export type FollowingsResponse = z.infer<typeof followingsResponse>;
