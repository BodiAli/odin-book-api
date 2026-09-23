import { createServer, Server } from "node:http";
import WebSocket from "ws";
import WebSocketApp from "#src/websocket/index.js";

const utils: {
  server: Server | null;
  connectClient(
    this: void,
    token: string,
    isAutoPong?: boolean,
  ): Promise<WebSocket>;
  waitForMessage<T>(ws: WebSocket, timeout?: number): Promise<T>;
  waitForClose(
    this: void,
    ws: WebSocket,
  ): Promise<{ code: number; reason: string }>;
  initiateWebSocketServer(): void;
  closeServer(): void;
} = {
  server: null,
  connectClient(token, isAutoPong = true) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:8080?token=${token}`, {
        autoPong: isAutoPong,
      });
      ws.on("open", () => {
        resolve(ws);
      });
      ws.on("error", reject);
    });
  },
  waitForMessage<T>(ws: WebSocket, timeout = 3000): Promise<T> {
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
  },
  waitForClose(ws) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Client did not close."));
      }, 2000);
      ws.on("close", function (code, reason) {
        clearTimeout(timer);
        resolve({ code, reason: reason.toString("utf-8") });
      });
    });
  },
  initiateWebSocketServer() {
    this.server = createServer();
    new WebSocketApp(this.server);
    this.server.listen(8080);
  },
  closeServer() {
    if (this.server) {
      this.server.close();
    }
  },
};

export default utils;
