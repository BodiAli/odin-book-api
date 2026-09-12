import prisma from "#src/db/prisma-client.js";
import generateNotificationMessage from "#src/utils/generate-notification-message.js";
import type {
  SentNotification,
  NotificationModel,
} from "#src/types/routes/notifications.js";
import type { NotificationType } from "#src/generated/prisma/enums.js";

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
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return {
    id: createdNotification.id,
    actorId: createdNotification.actorId,
    actorName: createdNotification.actor.fullName,
    createdAt: createdNotification.createdAt,
    notifierId: createdNotification.notifierId,
    type: createdNotification.type,
  };
}

export async function getUserNotifications(
  currentUserId: string,
): Promise<SentNotification[]> {
  const currentUserNotifications = await prisma.notification.findMany({
    where: {
      notifierId: currentUserId,
    },
    include: {
      actor: {
        select: {
          fullName: true,
          profile: {
            select: {
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const notificationsResponse = currentUserNotifications.map<SentNotification>(
    ({ id, actor, createdAt, type }) => {
      const message = generateNotificationMessage({
        type,
        actorName: actor.fullName,
        entityId: null,
      });
      const actorProfilePicture = actor.profile?.imageUrl ?? null;

      return {
        id,
        actorProfilePicture,
        message,
        createdAt,
        type,
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
