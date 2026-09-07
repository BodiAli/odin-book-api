import type { WebSocket } from "ws";

export function waitForMessage<T>(ws: WebSocket): Promise<T> {
  return new Promise((resolve) => {
    ws.on("message", (rawData: Buffer) => {
      const stringData = rawData.toString("utf-8");
      const data = JSON.parse(stringData) as T;
      resolve(data);
    });
  });
}
