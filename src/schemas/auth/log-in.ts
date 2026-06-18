import { z } from "zod";

export const logInRequestBody = z.object({
  email: z
    .email("Please provide a valid Email.")
    .max(254, "Email cannot exceed 254 characters."),
  password: z
    .string("Please provide a string Password.")
    .nonempty("Password cannot be empty."),
});

export type LogInRequestBody = z.infer<typeof logInRequestBody>;
