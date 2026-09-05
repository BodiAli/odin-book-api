import assert from "node:assert";
import { WebSocketServer } from "ws";
import authenticateUser from "./authenticate-user.js";
import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";

class WebSocketApp {
  wss = new WebSocketServer({ noServer: true });

  constructor() {
    this.handleConnection();
  }

  handleConnection(): void {
    this.wss.on("connection", (ws, req) => {
      console.log("CONNECTED", req.user);
    });
  }

  serverUpgrade(server: Server): void {
    server.on("upgrade", (req, socket, head) => {
      void this.handleUpgrade(req, socket, head);
    });
  }

  private async handleUpgrade(
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ): Promise<void> {
    try {
      assert(req.url, "req.url not defined");
      const user = await authenticateUser(req.url);
      req.user = user;
    } catch (err) {
      console.log(err);

      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit("connection", ws, req);
    });
  }
}

export default WebSocketApp;
