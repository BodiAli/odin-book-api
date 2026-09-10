import type { User } from "../routes/users.ts";

declare module "ws" {
  interface WebSocket {
    user: User;
  }
}
