import { createServer } from "node:http";
import WebSocket from "ws";
import WebSocketApp from "#src/websocket/index.js";

export function waitForMessage<T>(ws: WebSocket, timeout = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("No message received"));
    }, timeout);
    ws.on("message", (rawData: Buffer) => {
      clearTimeout(timer);
      const stringData = rawData.toString("utf-8");
      const data = JSON.parse(stringData) as T;
      resolve(data);
    });
  });
}

export function waitForClose(
  ws: WebSocket,
): Promise<{ code: number; reason: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Client did not close."));
    }, 2000);
    ws.on("close", function (code, reason) {
      clearTimeout(timer);
      resolve({ code, reason: reason.toString("utf-8") });
    });
  });
}

export function initiateWebSocketServer(): void {
  const server = createServer();
  new WebSocketApp(server);
  server.listen(8080);
}

export function connectClient(
  token: string,
  isAutoPong = true,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:8080?token=${token}`, {
      autoPong: isAutoPong,
    });
    ws.on("open", () => {
      resolve(ws);
    });
    ws.on("error", reject);
  });
}
