import type { NotificationType } from "#src/generated/prisma/enums.js";

interface NoEntityNotificationData {
  actorName: string;
  type: Extract<NotificationType, "FOLLOW">;
  entityId: null;
}

interface EntityNotificationData {
  actorName: string;
  type: Exclude<NotificationType, "FOLLOW">;
  entityId: string;
}

type NotificationData = NoEntityNotificationData | EntityNotificationData;

export default async function generateNotification({
  actorName,
  type,
  entityId,
}: NotificationData): Promise<string> {
  switch (type) {
    case "FOLLOW": {
      return `${actorName} started following you.`;
    }
    case "COMMENT": {
      // TODO: get post title and generate a notification
    }
  }
}
