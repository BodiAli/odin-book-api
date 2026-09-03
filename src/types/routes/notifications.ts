import type { PublicUser } from "./users.js";

export interface Notification {
  id: string;
  text: string;
  actor: Pick<PublicUser, "fullName" | "id" | "picture">;
}
