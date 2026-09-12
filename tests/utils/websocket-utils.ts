import { createServer } from "node:http";
import WebSocket from "ws";
import WebSocketApp from "#src/websocket/index.js";

export function waitForMessage<T>(ws: WebSocket): Promise<T> {
  return new Promise((resolve) => {
    ws.on("message", (rawData: Buffer) => {
      const stringData = rawData.toString("utf-8");
      const data = JSON.parse(stringData) as T;
      resolve(data);
    });
  });
}

export function waitForClose(
  ws: WebSocket,
): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => {
    ws.on("close", function (code, reason) {
      resolve({ code, reason: reason.toString("utf-8") });
    });
  });
}

export function initiateWebSocketServer(): void {
  const server = createServer();
  new WebSocketApp(server);
  server.listen(8080);
}

export function connectClient(token: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    ws.on("open", () => {
      resolve(ws);
    });
    ws.on("error", reject);
  });
}
