import type { User } from "../routes/users.ts";

declare module "node:http" {
  interface IncomingMessage {
    user: User;
  }
}
