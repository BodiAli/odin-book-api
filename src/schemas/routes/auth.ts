import { z } from "zod";
import { user } from "./users.js";

export const authenticatedResponse = z.object({
  token: z.string(),
  user: user,
});

export const logInRequestBody = z.object({
  email: z
    .email("Please provide a valid Email.")
    .max(254, "Email cannot exceed 254 characters."),
  password: z
    .string("Please provide a string Password.")
    .nonempty("Password cannot be empty."),
});

export const oauth2RequestBody = z.xor(
  [
    z.object({
      success: z.literal(true, { error: "Please provide a boolean." }),
      code: z.string("Please provide an authorization code."),
      codeVerifier: z.string("Please provide a code verifier."),
    }),
    z.object({
      success: z.literal(false, { error: "Please provide a boolean." }),
      error: z.string("Please provide a string error."),
    }),
  ],
  "Invalid input.",
);

export const signUpRequestBody = z
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
