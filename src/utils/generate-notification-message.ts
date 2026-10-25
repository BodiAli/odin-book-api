import assert from "node:assert";
import type { NotificationEntities } from "#src/types/routes/notifications.js";

interface GenerateNotification {
  actorName: string;
  notificationEntities: NotificationEntities;
}

function trimText(text: string): string {
  if (text.length > 50) {
    return `${text.slice(0, 47)}...`;
  }
  return text;
}

export default function generateNotificationMessage({
  actorName,
  notificationEntities,
}: GenerateNotification): string {
  switch (notificationEntities.type) {
    case "FOLLOW":
      return `${actorName} started following you.`;
    case "COMMENT":
      assert(notificationEntities.post, "Post not found.");
      return `${actorName} commented on your post "${trimText(notificationEntities.post.title)}"`;
    case "REPLY":
      assert(notificationEntities.parentComment, "Post not found.");
      return `${actorName} replied to your comment "${trimText(notificationEntities.parentComment.content)}"`;
    default:
      notificationEntities.type satisfies never;
      throw new Error("Unknown notification type.");
  }
}
