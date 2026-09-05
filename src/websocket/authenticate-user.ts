import assert from "node:assert";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "#src/config/config.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { User } from "#src/types/routes/users.js";

export default async function authenticateUser(url: string): Promise<User> {
  const token = new URL(`${config.origin}${url}`).searchParams.get("token");

  if (!token) {
    throw new Error("Unauthorized");
  }
  const tokenPayload = jwt.verify(token, config.jwtSecret) as JwtPayload;

  assert(tokenPayload.sub, "Token sub is not defined");
  const user = await userQueries.getUserById(tokenPayload.sub);
  assert(user, "User not defined");
  return user;
}
