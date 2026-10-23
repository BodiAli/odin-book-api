import assert from "node:assert";
import prisma from "#src/db/prisma-client.js";
import generateNotificationMessage from "#src/utils/generate-notification-message.js";
import { Prisma } from "#src/generated/prisma/client.js";
import type {
  NotificationEntity,
  SentNotification,
} from "#src/types/routes/notifications.js";
import type { NotificationType } from "#src/generated/prisma/enums.js";

interface CreateNotificationArg {
  actorId: string;
  notifierId: string;
  type: NotificationType;
  entityId: string;
}

export async function createNotification({
  actorId,
  notifierId,
  type,
  entityId,
}: CreateNotificationArg): Promise<{ id: string }> {
  try {
    const normalizedEntityId =
      type === "FOLLOW"
        ? { profileId: entityId }
        : type === "COMMENT"
          ? { postId: entityId }
          : { commentId: entityId };

    const createdNotification = await prisma.notification.create({
      data: {
        actorId,
        notifierId,
        type,
        ...normalizedEntityId,
      },
    });

    return { id: createdNotification.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error("Foreign key constraint failed.", { cause: error });
    }
    throw error;
  }
}

function getEntityId(notificationEntity: NotificationEntity): string {
  switch (notificationEntity.type) {
    case "FOLLOW":
      assert(notificationEntity.profile, "Profile missing");
      return notificationEntity.profile.id;
    case "COMMENT":
      assert(notificationEntity.post, "Post missing");
      return notificationEntity.post.id;
    case "REPLY":
      assert(notificationEntity.comment, "Comment missing");
      return notificationEntity.comment.id;
    default:
      throw new Error("Unknown notification entity type");
  }
}

export async function getUserNotifications(
  currentUserId: string,
): Promise<SentNotification[]> {
  const currentUserNotifications = await prisma.notification.findMany({
    where: {
      notifierId: currentUserId,
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      actor: {
        select: {
          id: true,
          profile: {
            select: {
              imageUrl: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
      profile: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const notificationsResponse = currentUserNotifications.map<SentNotification>(
    (notification) => {
      const notificationEntity: NotificationEntity = {
        type: notification.type,
        comment: notification.comment,
        post: notification.post,
        profile: notification.profile,
      };
      const entityId = getEntityId(notificationEntity);
      const actorProfilePicture = notification.actor.profile?.imageUrl ?? null;

      return {
        id: notification.id,
        actorProfilePicture,
        createdAt: notification.createdAt,
        actorId: notification.actor.id,
        type: notification.type,
        entityId,
        message: "FOO",
      };
    },
  );

  return notificationsResponse;
}

export async function getSentNotification(
  notificationId: string,
): SentNotification {
  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      actor: {
        select: {
          id: true,
          profile: {
            select: {
              imageUrl: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
      profile: {
        select: {
          id: true,
        },
      },
    },
  });
  if (notification === null) {
    throw new Error("Notification not found.");
  }

  return {
    id: notification.id,
  };
}
