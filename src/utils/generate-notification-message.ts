import type { DiscriminatedNotificationType } from "#src/types/routes/notifications.js";

interface GenerateNotification {
  actorName: string;
  notificationType: DiscriminatedNotificationType;
}

function trimText(text: string): string {
  if (text.length > 50) {
    return `${text.slice(0, 47)}...`;
  }
  return text;
}

export default function generateNotificationMessage({
  actorName,
  notificationType,
}: GenerateNotification): string {
  switch (notificationType.type) {
    case "FOLLOW":
      return `${actorName} started following you.`;
    case "COMMENT":
      return `${actorName} commented on your post "${trimText(notificationType.post.title)}"`;
    case "REPLY":
      return `${actorName} replied to your comment "${trimText(notificationType.comment.content)}"`;
    default:
      notificationType satisfies never;
      throw new Error("Unknown notification type.");
  }
}
