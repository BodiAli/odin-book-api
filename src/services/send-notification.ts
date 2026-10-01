import generateNotificationMessage from "#src/utils/generate-notification-message.js";
import Clients from "#src/websocket/clients.js";
import { EventType } from "#src/types/websocket/event-type.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import sendFrame from "#src/websocket/send-frame.js";
import type { NotificationModel } from "#src/types/routes/notifications.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";

export default async function sendNotification(
  notification: NotificationModel,
): Promise<void> {
  const clients = Clients.getInstance();
  const isConnected = clients.hasConnection(notification.notifierId);
  if (!isConnected) {
    return;
  }

  const notificationMessage = generateNotificationMessage({
    actorName: notification.actorName,
    type: notification.type,
    entityId: null,
  });
  const actorProfilePicture = await profileQueries.getProfilePicture(
    notification.actorId,
  );
  const notificationFrame: ServerDataFrame = {
    type: EventType.NOTIFICATION,
    success: true,
    data: {
      actorProfilePicture,
      createdAt: notification.createdAt,
      id: notification.id,
      type: notification.type,
      message: notificationMessage,
    },
  };
  sendFrame(notification.notifierId, notificationFrame);
}
