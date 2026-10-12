import { z } from "zod";

export const authenticatedResponse = z.object({
  token: z.string(),
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
