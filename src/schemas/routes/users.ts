import { z } from "zod";
import { Provider } from "#src/generated/prisma/enums.js";
import type { UserModel } from "#src/generated/prisma/models.js";

export const user: z.ZodType<
  Omit<UserModel, "password" | "lastSeen"> & { picture: string | null }
> = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string(),
  fullName: z.string(),
  provider: z.enum(Provider),
  picture: z.string().nullable(),
  isOnline: z.boolean(),
  isGuest: z.boolean(),
});

export const publicUser: z.ZodType<
  Pick<UserModel, "id" | "fullName" | "isOnline" | "lastSeen"> & {
    picture: string | null;
  }
> = z.object({
  id: z.uuid(),
  fullName: z.string(),
  isOnline: z.boolean(),
  lastSeen: z.date(),
  picture: z.string().nullable(),
});

export const followersResponse = z.xor([
  z.object({ count: z.number() }),
  z.object({ followers: z.array(publicUser) }),
]);

export const followingsResponse = z.xor([
  z.object({ count: z.number() }),
  z.object({ followings: z.array(publicUser) }),
]);
