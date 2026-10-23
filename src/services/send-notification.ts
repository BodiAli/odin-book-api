import Clients from "#src/websocket/clients.js";
import { EventType } from "#src/types/websocket/event-type.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import sendFrame from "#src/websocket/send-frame.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";

export default async function sendNotification(
  notifierId: string,
  notificationId: string,
): Promise<void> {
  const clients = Clients.getInstance();
  const isConnected = clients.hasConnection(notifierId);
  if (!isConnected) {
    return;
  }

  const notification =
    await notificationQueries.getSentNotification(notificationId);
  const notificationFrame: ServerDataFrame = {
    type: EventType.NOTIFICATION,
    success: true,
    data: notification,
  };
  sendFrame(notifierId, notificationFrame);
}
