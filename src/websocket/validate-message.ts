import assert from "node:assert";
import { ZodError } from "zod";
import CustomWebSocketError from "#src/errors/websocket-error.js";
import { clientMessageData } from "#src/schemas/websocket/message-data.js";
import type { ClientDataFrame } from "#src/types/websocket/data-frames.js";

export default function validateMessage(data: Buffer): ClientDataFrame | never {
  const stringData = data.toString("utf-8");
  try {
    const parsedData = JSON.parse(stringData) as object;
    const validData = clientMessageData.parse(parsedData);
    return validData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CustomWebSocketError(1007, "Invalid JSON");
    }
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];
      assert(firstIssue, "First issue is undefined");
      throw new CustomWebSocketError(1007, firstIssue.message);
    }
    throw error;
  }
}
