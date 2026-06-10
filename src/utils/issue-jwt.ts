import * as jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export default function issueJwt(sub: string, expiresIn: StringValue) {
  const token = jwt.sign({ sub }, process.env.JWT_SECRET, {
    expiresIn,
  });

  return token;
}
