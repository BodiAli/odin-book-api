import type z from "zod";
import type { EventType } from "./event-type.js";
import type { clientMessageData } from "#src/schemas/websocket/message-data.js";
import type { SentNotification } from "../routes/notifications.js";

export interface ServerNotificationFrame {
  success: boolean;
  type: EventType.NOTIFICATION;
  data: SentNotification;
}
export interface ServerMessageFrame {
  success: boolean;
  type: EventType.MESSAGE;
  data: {
    message: string;
  };
}

export type ServerDataFrame = ServerNotificationFrame | ServerMessageFrame;

export type ClientDataFrame = z.infer<typeof clientMessageData>;
