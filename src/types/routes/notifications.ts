import type { NotificationType } from "#src/generated/prisma/enums.js";
import type {
  CommentModel,
  PostModel,
  ProfileModel,
} from "#src/generated/prisma/models.js";
import type {
  sentNotification,
  notificationsResponse,
  notificationModel,
} from "#src/schemas/routes/notifications.js";
import type { z } from "zod";

export type NotificationModel = z.infer<typeof notificationModel>;
export type SentNotification = z.infer<typeof sentNotification>;
export type NotificationsResponse = z.infer<typeof notificationsResponse>;

export interface NotificationEntities {
  type: NotificationType;
  profile: Pick<ProfileModel, "id"> | null;
  post: Pick<PostModel, "title" | "id"> | null;
  comment: Pick<CommentModel, "content" | "id"> | null;
  parentComment: Pick<CommentModel, "content" | "id"> | null;
}
export type NotificationTarget = SentNotification["target"];
