import assert from "node:assert";
import { WebSocket, WebSocketServer } from "ws";
import CustomWebSocketError from "#src/errors/websocket-error.js";
import appEmitter from "#src/events/app-emitter.js";
import authorizeUser from "./authorize-user.js";
import validateMessage from "./validate-message.js";
import clients from "./clients.js";
import type { IncomingMessage, Server } from "node:http";

class WebSocketApp {
  wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.init();
  }

  private init(): void {
    this.wss.on("connection", this.handleConnection);
    appEmitter.listenForNotification();
  }

  private handleConnection = (ws: WebSocket, req: IncomingMessage): void => {
    assert(req.url, "Url is not defined");
    const isAuthorized = this.handleAuthorization(ws, req);
    if (!isAuthorized) {
      ws.close(1008, "Access token is missing or invalid.");
      return;
    }

    ws.on("message", this.handleMessage.bind(this, ws));
  };

  handleAuthorization(ws: WebSocket, req: IncomingMessage): boolean {
    assert(req.url, "Url is not defined");
    try {
      const userId = authorizeUser(req.url);
      ws.id = userId;
      clients.insertClient(ws);
      return true;
    } catch {
      return false;
    }
  }

  handleMessage = (ws: WebSocket, data: Buffer): void => {
    try {
      const validMessage = validateMessage(data);
    } catch (error) {
      if (error instanceof CustomWebSocketError) {
        ws.close(error.code, error.message);
        return;
      }
      ws.close(1006, "Unexpected error occurred.");
      return;
    }
  };
}

export default WebSocketApp;
