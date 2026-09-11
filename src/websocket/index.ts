import assert from "node:assert";
import { WebSocket, WebSocketServer } from "ws";
import CustomWebSocketError from "#src/errors/websocket-error.js";
import authorizeUser from "./authorize-user.js";
import validateMessage from "./validate-message.js";
import type { IncomingMessage, Server } from "node:http";

class WebSocketApp {
  wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.init();
  }

  private init(): void {
    this.wss.on("connection", this.handleConnection);
  }

  private handleConnection = (ws: WebSocket, req: IncomingMessage): void => {
    assert(req.url, "Url is not defined");
    try {
      const userId = authorizeUser(req.url);
      ws.userId = userId;
    } catch {
      ws.close(1008, "Access token is missing or invalid.");
      return;
    }

    ws.on("message", (data) => {
      console.log("received");
      ws.send(data);
    });
  };

  handleMessage(this: WebSocket, data: Buffer): void {
    try {
      validateMessage(data);
    } catch (error) {
      if (error instanceof CustomWebSocketError) {
        this.close(error.code, error.message);
      }
    }
  }
}

export default WebSocketApp;
