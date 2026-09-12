import type { NotificationType } from "#src/generated/prisma/enums.js";

interface NotificationData {
  actorName: string;
  type: NotificationType;
  entityId: string | null;
}

export default function generateNotificationMessage({
  actorName,
  type,
}: NotificationData): string {
  switch (type) {
    case "FOLLOW": {
      return `${actorName} started following you.`;
    }
  }
  return "NOT IMPLEMENTED";
}
