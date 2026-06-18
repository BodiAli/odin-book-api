// module 'jsonwebtoken' is a CommonJS module, which may not support all module.exports as named exports.
// CommonJS modules can always be imported via the default export
// eslint-disable-next-line import-x/default
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export default function issueJwt(sub: string, expiresIn: StringValue = "2w") {
  const token = jwt.sign({ sub }, process.env.JWT_SECRET, {
    expiresIn,
  });

  return token;
}
