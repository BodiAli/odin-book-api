import type {
  authenticatedResponse,
  logInRequestBody,
  oauth2RequestBody,
  signUpRequestBody,
} from "#src/schemas/auth.js";
import type { z } from "zod";

export type AuthenticatedResponse = z.infer<typeof authenticatedResponse>;

export type LogInRequestBody = z.infer<typeof logInRequestBody>;
export type SignUpRequestBody = z.infer<typeof signUpRequestBody>;

export type Oauth2RequestBody = z.infer<typeof oauth2RequestBody>;
export interface Oauth2UserData {
  sub: string;
  email: string;
  name: string;
  picture: string;
}
