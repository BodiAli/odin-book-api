import type z from "zod";
import type { EventType } from "./event-type.js";
import type { clientMessageData } from "#src/schemas/websocket/message-data.js";
import type { SentNotification } from "../routes/notifications.js";

interface NotificationFrame {
  success: boolean;
  type: EventType.NOTIFICATION;
  data: SentNotification;
}
interface MessageFrame {
  success: boolean;
  type: EventType.MESSAGE;
  data: {
    message: string;
  };
}

export type ServerDataFrame = NotificationFrame | MessageFrame;

export type ClientDataFrame = z.infer<typeof clientMessageData>;
