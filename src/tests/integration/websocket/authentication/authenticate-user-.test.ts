import { createServer } from "node:http";
import WebSocketApp from "#src/websocket/index.js";

describe("authentication", () => {
  const server = createServer();

  beforeAll(() => {
    new WebSocketApp().serverUpgrade(server);
    server.listen(3000);
  });

  it("should return a 401 response");
});
