import assert from "node:assert";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "#src/config/config.js";

export default function authorizeUser(url: string): string {
  const token = new URL(`${config.origin}${url}`).searchParams.get("token");
  if (!token) {
    throw new Error("Unauthorized");
  }
  const tokenPayload = jwt.verify(token, config.jwtSecret) as JwtPayload;
  assert(tokenPayload.sub, "Token sub is not defined");

  return tokenPayload.sub;
}
