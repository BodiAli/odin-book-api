import assert from "node:assert";
import { WebSocketServer } from "ws";
import authenticateUser from "./authenticate-user.js";
import type { Server } from "node:http";

class WebSocketApp {
  wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.handleConnection();
  }

  handleConnection(): void {
    this.wss.on("connection", async (ws, req) => {
      assert(req.url, "Url is not defined");
      try {
        const user = await authenticateUser(req.url);
        ws.user = user;
      } catch {
        ws.close(1008, "Access token is missing or invalid.");
        return;
      }
    });
  }
}

export default WebSocketApp;
