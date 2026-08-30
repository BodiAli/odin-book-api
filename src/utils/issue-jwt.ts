import jwt from "jsonwebtoken";
import config from "#src/config/config.js";
import type { StringValue } from "ms";

export default function issueJwt(
  sub: string,
  expiresIn: StringValue = "2w",
): string {
  const token = jwt.sign({ sub }, config.jwtSecret, {
    expiresIn,
  });

  return token;
}
