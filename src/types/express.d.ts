import type { User as UserSchema } from "#src/schemas/users.js";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}
