import prisma from "#src/db/prisma-client.js";
import generateNotification from "#src/utils/generate-notification.js";
import * as profileQueries from "./profile-queries.js";
import type { Notification } from "#src/types/routes/notifications.js";
import type { NotificationType } from "#src/generated/prisma/enums.js";
import type { NotificationModel } from "#src/generated/prisma/models.js";

export async function createNotification({
  actorId,
  notifierId,
  type,
}: CreateNotificationArg): Promise<NotificationModel> {
  const createdNotification = await prisma.notification.create({
    data: {
      type,
      actorId,
      notifierId,
    },
  });

  return createdNotification;
}

export async function getUserNotifications(
  currentUserId: string,
): Promise<Notification[]> {
  const currentUserNotifications = await prisma.notification.findMany({
    where: {
      notifierId: currentUserId,
    },
    select: {
      actor: {
        select: {
          fullName: true,
        },
      },
      id: true,
    },
  });
  const actorProfilePicture =
    await profileQueries.getProfilePicture(currentUserId);

  const notificationsResponse = currentUserNotifications.map<Notification>(
    ({ id, actor }) => {
      const message = generateNotification({
        actorName: actor.fullName,
        type: "FOLLOW",
        entityId: null,
      });
      return {
        id,
        actorProfilePicture,
        message,
      };
    },
  );

  return notificationsResponse;
}

interface CreateNotificationArg {
  actorId: string;
  notifierId: string;
  type: NotificationType;
}
