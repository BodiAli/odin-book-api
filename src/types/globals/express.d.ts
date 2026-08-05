import type { User as UserSchema } from "#src/types/routes/users.js";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}
