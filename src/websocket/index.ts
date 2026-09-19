import assert from "node:assert";
import { WebSocket, WebSocketServer } from "ws";
import CustomWebSocketError from "#src/errors/websocket-error.js";
import AppEmitter from "#src/events/app-emitter.js";
import authorizeUser from "./authorize-user.js";
import validateMessage from "./validate-message.js";
import Clients from "./clients.js";
import type { IncomingMessage, Server } from "node:http";

class WebSocketApp {
  wss: WebSocketServer;
  clients: Clients = Clients.getInstance();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.init();
  }

  private init(): void {
    this.wss.on("connection", this.handleConnection);
    AppEmitter.getInstance().listenForNotification();
  }

  private handleConnection = (ws: WebSocket, req: IncomingMessage): void => {
    assert(req.url, "Url is not defined");
    const isAuthorized = this.handleAuthorization(ws, req);
    if (!isAuthorized) {
      ws.close(1008, "Access token is missing or invalid.");
      return;
    }

    ws.on("message", this.handleMessage.bind(this, ws));
    ws.on("close", (code, reason) => {
      this.clients.removeConnection(req.id, ws);
    });
  };

  private handleAuthorization(ws: WebSocket, req: IncomingMessage): boolean {
    assert(req.url, "Url is not defined");
    try {
      const userId = authorizeUser(req.url);
      req.id = userId;
      if (this.clients.hasConnection(userId)) {
        this.clients.insertClient(userId, ws);
      } else {
        this.clients.createUserConnection(userId);
        this.clients.insertClient(userId, ws);
      }
      return true;
    } catch {
      return false;
    }
  }

  private handleMessage = (ws: WebSocket, data: Buffer): void => {
    try {
      const validMessage = validateMessage(data);
    } catch (error) {
      if (error instanceof CustomWebSocketError) {
        ws.close(error.code, error.message);
        return;
      }
      ws.close(1011, "Unexpected error occurred.");
      return;
    }
  };
}

export default WebSocketApp;
