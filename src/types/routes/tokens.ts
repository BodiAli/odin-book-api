import type {
  authenticatedResponse,
  logInRequestBody,
  oauth2RequestBody,
} from "#src/schemas/routes/tokens.js";
import type { z } from "zod";

export type AuthenticatedResponse = z.infer<typeof authenticatedResponse>;

export type LogInRequestBody = z.infer<typeof logInRequestBody>;

export type Oauth2RequestBody = z.infer<typeof oauth2RequestBody>;
export interface Oauth2UserData {
  email: string;
  name: string;
  picture: string;
}
