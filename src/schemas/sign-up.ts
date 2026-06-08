import { z } from "zod";
import { UserSchema } from "./user-schema.js";

export const RequestBody = z
  .object({
    email: z
      .email("Please provide a valid Email.")
      .max(254, "Email cannot exceed 254 characters."),
    username: z
      .string("Please provide a string Username.")
      .trim()
      .nonempty("Username cannot be empty.")
      .regex(/^\S+$/, "Username cannot include space.")
      .max(100, "Username cannot exceed 100 characters."),
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

export const ResponseBody = z.object({
  token: z.jwt(),
  user: UserSchema,
});
