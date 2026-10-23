import z from "zod";
import { NotificationType } from "#src/generated/prisma/enums.js";
import type { NotificationModel } from "#src/generated/prisma/models.js";

export const sentNotification: z.ZodType<
  Omit<
    NotificationModel,
    "notifierId" | "postId" | "commentId" | "profileId"
  > & {
    actorProfilePicture: string | null;
    message: string;
    entityId: string;
    type: NotificationType;
  }
> = z.object({
  id: z.string(),
  actorProfilePicture: z.string().nullable(),
  message: z.string(),
  createdAt: z.date(),
  actorId: z.string(),
  entityId: z.string(),
  type: z.enum(NotificationType),
});

export const notificationsResponse = z.object({
  notifications: z.array(sentNotification),
});

export const notificationModel: z.ZodType<NotificationModel> = z.object({
  id: z.string(),
  actorId: z.string(),
  createdAt: z.date(),
  notifierId: z.string(),
  commentId: z.string().nullable(),
  postId: z.string().nullable(),
  profileId: z.string().nullable(),
  type: z.enum(NotificationType),
});
