import z from "zod";
import { NotificationType } from "#src/generated/prisma/enums.js";
import type { NotificationModel } from "#src/generated/prisma/models.js";

const followNotification = z.object({
  type: z.literal("FOLLOW"),
  profileId: z.string(),
});
const commentNotification = z.object({
  type: z.literal("COMMENT"),
  postId: z.string(),
  commentId: z.string(),
});
const replyNotification = z.object({
  type: z.literal("REPLY"),
  postId: z.string(),
  commentId: z.string(),
  parentCommentId: z.string(),
});
const notificationTarget = z.discriminatedUnion("type", [
  followNotification,
  commentNotification,
  replyNotification,
]);
const baseNotification: z.ZodType<
  Omit<NotificationModel, "notifierId" | "commentId" | "type"> & {
    actorProfilePicture: string | null;
    message: string;
  }
> = z.object({
  id: z.string(),
  actorProfilePicture: z.string().nullable(),
  message: z.string(),
  createdAt: z.date(),
  actorId: z.string(),
});

export const sentNotification = z.intersection(
  baseNotification,
  z.object({ target: notificationTarget }),
);

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
