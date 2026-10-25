import assert from "node:assert";
import prisma from "#src/db/prisma-client.js";
import generateNotificationMessage from "#src/utils/generate-notification-message.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import { Prisma } from "#src/generated/prisma/client.js";
import type {
  NotificationEntities,
  NotificationTarget,
  SentNotification,
} from "#src/types/routes/notifications.js";
import type { NotificationType } from "#src/generated/prisma/enums.js";

interface CreateFollowNotification {
  type: Extract<NotificationType, "FOLLOW">;
}
interface CreateCommentNotification {
  type: Extract<NotificationType, "COMMENT">;
  commentId: string;
}

interface CreateReplyNotification {
  type: Extract<NotificationType, "REPLY">;
  commentId: string;
}

type CreateNotificationArg = {
  actorId: string;
  notifierId: string;
} & (
  CreateReplyNotification | CreateCommentNotification | CreateFollowNotification
);

export async function createNotification(
  param: CreateNotificationArg,
): Promise<{ id: string }> {
  try {
    const normalizedEntityId =
      param.type === "COMMENT" || param.type === "REPLY"
        ? { commentId: param.commentId }
        : {};

    const createdNotification = await prisma.notification.create({
      data: {
        actorId: param.actorId,
        notifierId: param.notifierId,
        type: param.type,
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

function getTarget(
  notificationEntities: NotificationEntities,
): NotificationTarget {
  switch (notificationEntities.type) {
    case "FOLLOW":
      assert(notificationEntities.profile, "Profile not found.");
      return {
        type: notificationEntities.type,
        profileId: notificationEntities.profile.id,
      };
    case "COMMENT":
      assert(notificationEntities.post, "Post not found.");
      assert(notificationEntities.comment, "Comment not found.");
      return {
        type: notificationEntities.type,
        commentId: notificationEntities.comment.id,
        postId: notificationEntities.post.id,
      };
    case "REPLY":
      assert(notificationEntities.post, "Post not found.");
      assert(notificationEntities.comment, "Comment not found.");
      assert(notificationEntities.parentComment, "Parent comment not found.");
      return {
        type: notificationEntities.type,
        postId: notificationEntities.post.id,
        commentId: notificationEntities.comment.id,
        parentCommentId: notificationEntities.parentComment.id,
      };
    default:
      notificationEntities.type satisfies never;
      throw new Error("Unknown notification type.");
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
          fullName: true,
          profile: {
            select: {
              id: true,
              imageUrl: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
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
    (notification) => {
      const actorProfilePicture = notification.actor.profile
        ? notification.actor.profile.imageUrl
        : null;
      const notificationComment = notification.comment ?? null;
      const notificationEntities: NotificationEntities = {
        type: notification.type,
        comment: notificationComment,
        parentComment: notificationComment?.parent ?? null,
        post: notificationComment?.post ?? null,
        profile: notification.actor.profile,
      };
      const target = getTarget(notificationEntities);
      const notificationMessage = generateNotificationMessage({
        actorName: notification.actor.fullName,
        notificationEntities,
      });

      return {
        id: notification.id,
        actorProfilePicture,
        createdAt: notification.createdAt,
        actorId: notification.actor.id,
        target,
        message: notificationMessage,
      };
    },
  );

  return notificationsResponse;
}

export async function getSentNotification(
  notificationId: string,
): Promise<SentNotification> {
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
          fullName: true,
          profile: {
            select: {
              id: true,
              imageUrl: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      },
    },
  });
  if (notification === null) {
    throw new Error("Notification not found.");
  }

  const notificationComment = notification.comment ?? null;
  const notificationEntities: NotificationEntities = {
    type: notification.type,
    comment: notificationComment,
    parentComment: notificationComment?.parent ?? null,
    post: notificationComment?.post ?? null,
    profile: notification.actor.profile,
  };
  const target = getTarget(notificationEntities);
  const notificationMessage = generateNotificationMessage({
    actorName: notification.actor.fullName,
    notificationEntities,
  });
  const actorProfilePicture = await profileQueries.getProfilePicture(
    notification.actor.id,
  );

  return {
    id: notification.id,
    actorId: notification.actor.id,
    actorProfilePicture,
    createdAt: notification.createdAt,
    message: notificationMessage,
    target,
  };
}
