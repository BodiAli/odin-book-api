import type { NotificationType } from "#src/generated/prisma/enums.js";

interface NotificationData {
  actorName: string;
  type: NotificationType;
  entityId: string | null;
}

export default function generateNotification({
  actorName,
  type,
  entityId,
}: NotificationData): string {
  switch (type) {
    case "FOLLOW": {
      return `${actorName} started following you.`;
    }
    case "COMMENT": {
      // TODO: get post title and generate a notification
    }
  }
}
