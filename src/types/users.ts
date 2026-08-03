import type { publicUser, user } from "#src/schemas/users.js";
import type { z } from "zod";

export type User = z.infer<typeof user>;
export type PublicUser = z.infer<typeof publicUser>;
