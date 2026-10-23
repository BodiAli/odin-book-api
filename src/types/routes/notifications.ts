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

interface CommentType {
  type: Extract<NotificationType, "COMMENT">;
  post: Pick<PostModel, "title">;
  comment: null;
}
interface ReplyType {
  type: Extract<NotificationType, "REPLY">;
  comment: Pick<CommentModel, "content">;
  post: null;
}
interface FollowType {
  type: Extract<NotificationType, "FOLLOW">;
  comment: null;
  post: null;
}
export type DiscriminatedNotificationType =
  CommentType | ReplyType | FollowType;

export interface NotificationEntity {
  type: NotificationType;
  comment: null | Pick<CommentModel, "id" | "content">;
  post: null | Pick<PostModel, "id" | "title">;
  profile: null | Pick<ProfileModel, "id">;
}
