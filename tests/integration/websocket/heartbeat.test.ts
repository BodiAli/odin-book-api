import Clients from "#src/websocket/clients.js";
import {
  connectClient,
  initiateWebSocketServer,
} from "#test-utils/websocket-utils.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type WebSocket from "ws";

describe("heartbeat mechanism", () => {
  beforeAll(() => {
    initiateWebSocketServer();
  });

  afterEach(() => {
    const clientsInstance = Clients.getInstance();
    for (const client of clientsInstance.clients) {
      client.close();
    }
  });

  function waitForPing(ws: WebSocket): Promise<string> {
    return new Promise((resolve) => {
      ws.on("ping", (data) => {
        resolve(data.toString());
      });
    });
  }

  it("should send 'ping' message every 30 seconds", async () => {
    expect.hasAssertions();

    const user = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    const token = issueJwt(user.id);
    const ws = await connectClient(token);

    vi.useFakeTimers();
    const ping1 = await waitForPing(ws);
    vi.advanceTimersByTime(30000);
    const ping2 = await waitForPing(ws);

    expect(ping1).toBe("ping");
    expect(ping2).toBe("ping");
  });
});
