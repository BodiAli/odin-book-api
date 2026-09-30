import { createServer, Server } from "node:http";
import WebSocket from "ws";
import WebSocketApp from "#src/websocket/index.js";
import Clients from "#src/websocket/clients.js";

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
  closeServer(): Promise<void>;
  cleanupConnection(): Promise<void>;
  waitForClientsToBeLength(length: number): Promise<void>;
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
  async closeServer() {
    await new Promise<void>((resolve, reject) => {
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }
    });
  },
  async cleanupConnection() {
    const clients = Clients.getInstance();
    for (const client of clients.clients) {
      client.close();
    }

    const now = Date.now();
    while (clients.clients.length > 0) {
      const timePassed = Date.now() - now;
      if (timePassed >= 1000) {
        throw new Error("Cleanup failed.");
      }
      await new Promise(setImmediate);
    }

    await this.closeServer();
  },
  async waitForClientsToBeLength(length): Promise<void> {
    const clients = Clients.getInstance();
    const now = Date.now();

    while (clients.clients.length !== length) {
      const timePassed = Date.now() - now;
      if (timePassed >= 500) {
        throw new Error("Client was not removed.");
      }
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
    }
  },
};

export default utils;
