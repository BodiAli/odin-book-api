import { z } from "zod";
import { user } from "../users/user-schema.js";

export const logInRequestBody = z.object({
  username: z
    .string("Please provide a string Username.")
    .trim()
    .nonempty("Username cannot be empty.")
    .regex(/^\S+$/, "Username cannot include space.")
    .max(100, "Username cannot exceed 100 characters."),
  password: z
    .string("Please provide a string Password.")
    .nonempty("Password cannot be empty."),
});
export const logInResponseBody = z.object({
  token: z.string(),
  user: user,
});

export type LogInRequestBody = z.infer<typeof logInRequestBody>;
export type LogInResponseBody = z.infer<typeof logInResponseBody>;
