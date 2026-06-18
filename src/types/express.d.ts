import type { User as UserSchema } from "#src/schemas/users/user-schema.ts";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}
