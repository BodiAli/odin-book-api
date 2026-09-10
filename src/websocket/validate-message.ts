import { ZodError } from "zod";
import CustomWebSocketError from "#src/errors/websocket-error.js";
import { messageData } from "#src/schemas/websocket/message-data.js";

export default function validateMessage(data: Buffer): void {
  const stringData = data.toString("utf-8");
  try {
    JSON.parse(stringData) as object;
  } catch {
    throw new CustomWebSocketError(1007, "Invalid JSON");
  }

  try {
    messageData.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CustomWebSocketError(1007, error);
    }
  }
}
