import { z } from "zod";
import { Provider } from "#src/generated/prisma/enums.js";
import type { UserModel } from "#src/generated/prisma/models.js";

export const createUserRequestBody = z
  .object({
    email: z
      .email("Please provide a valid Email.")
      .max(254, "Email cannot exceed 254 characters."),
    fullName: z
      .string("Please provide a string Full Name.")
      .trim()
      .nonempty("Full Name cannot be empty.")
      .max(100, "Username cannot exceed 100 characters."),
    password: z
      .string("Please provide a string Password.")
      .min(5, "Password must be at least 5 characters."),
    confirmPassword: z.string("Please provide a string Confirm Password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

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
  Omit<UserModel, "email" | "password" | "provider" | "isGuest"> & {
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
