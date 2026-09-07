import type {
  notification,
  notificationsResponse,
} from "#src/schemas/routes/notifications.js";
import type { z } from "zod";

export type Notification = z.infer<typeof notification>;
export type NotificationsResponse = z.infer<typeof notificationsResponse>;
