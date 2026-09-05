import { WebSocket } from "ws";
import WebSocketApp from "#src/websocket/server.js";

describe("notification action type", () => {
  const app = new WebSocketApp();

  function waitForMessage(ws: WebSocket): Promise<string> {
    return new Promise((resolve, reject) => {
      ws.on("message", (data) => {
        resolve(data.toString());
      });
    });
  }

  beforeAll(() => {
    app.start();
  });

  it("should send notification to target notifier", async () => {
    expect.hasAssertions();

    const userASocket = new WebSocket("ws://localhost:3000?userId=userA-id");
    const userBSocket = new WebSocket("ws://localhost:3000?userId=userB-id");

    userASocket.addEventListener("open", () => {
      userASocket.send(JSON.stringify({ notifierId: "userB-id" }));
    });

    const userBMessage = await waitForMessage(userBSocket);

    expect(userBMessage).toBe("GET NOTIFIED!");
  });
});
