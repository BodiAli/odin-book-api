import type {
  sentNotification,
  notificationsResponse,
  notificationModel,
} from "#src/schemas/routes/notifications.js";
import type { z } from "zod";

export type NotificationModel = z.infer<typeof notificationModel>;
export type SentNotification = z.infer<typeof sentNotification>;
export type NotificationsResponse = z.infer<typeof notificationsResponse>;
