import z from "zod";
import { NotificationType } from "#src/generated/prisma/enums.js";
import type { NotificationModel } from "#src/generated/prisma/models.js";

export const sentNotification: z.ZodType<
  Omit<NotificationModel, "notifierId" | "notificationEntityId"> & {
    actorProfilePicture: string | null;
    message: string;
    entityId: string;
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
  notificationEntityId: z.string(),
});
