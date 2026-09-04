/* eslint-disable @typescript-eslint/no-base-to-string */
import { WebSocketServer, type WebSocket } from "ws";

const wss = new WebSocketServer({ port: 3000 });

interface MessageData {
  type: "NOTIFICATION";
  notifierId: string;
}

const clients: WebSocket[] = [];

wss.on("connection", (ws, req) => {
  const url = new URL(`http://locahost${req.url}`);

  const userId = url.searchParams.get("userId");
  ws.userId = userId;
  clients.push(ws);

  ws.on("message", (rawData) => {
    const stringData = rawData.toString();
    const data = JSON.parse(stringData) as MessageData;
    console.log("DATA", data);

    const targetClient = clients.find((ws) => ws.userId === data.notifierId);

    for (const client of wss.clients) {
      if (client === targetClient) {
        client.send("GET NOTIFIED!");
      }
    }
  });
});

wss.on("listening", () => {
  console.log("Listening on port 3000");
});
