import type z from "zod";
import type { events } from "#src/events/index.js";
import type { clientMessageData } from "#src/schemas/websocket/message-data.js";
import type { SentNotification } from "../routes/notifications.js";

interface NotificationFrame {
  success: boolean;
  type: events.NOTIFICATION;
  data: SentNotification;
}
interface MessageFrame {
  success: boolean;
  type: events.MESSAGE;
  data: {
    message: string;
  };
}

export type ServerDataFrame = NotificationFrame | MessageFrame;

export type ClientDataFrame = z.infer<typeof clientMessageData>;
