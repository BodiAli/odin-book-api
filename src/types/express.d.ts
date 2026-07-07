import type { User as UserSchema } from "#src/schemas/user-schema.js";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}
