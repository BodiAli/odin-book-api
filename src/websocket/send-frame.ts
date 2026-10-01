import WebSocket from "ws";
import Clients from "./clients.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";

export default function sendFrame(
  userId: string,
  frame: ServerDataFrame,
): void {
  const clients = Clients.getInstance();
  const userClients = clients.getUserClients(userId);

  for (const client of userClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(frame));
    }
  }
}
