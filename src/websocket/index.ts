import assert from "node:assert";
import { WebSocketServer, WebSocket } from "ws";
import authenticateUser from "./authenticate-user.js";
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

  private handleConnection = async (
    ws: WebSocket,
    req: IncomingMessage,
  ): Promise<void> => {
    assert(req.url, "Url is not defined");
    try {
      const user = await authenticateUser(req.url);
      ws.user = user;
    } catch {
      ws.close(1008, "Access token is missing or invalid.");
      return;
    }
  };
}

export default WebSocketApp;
