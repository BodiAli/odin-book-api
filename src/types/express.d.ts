import type { User as UserSchema } from "#src/types/users.ts";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}
