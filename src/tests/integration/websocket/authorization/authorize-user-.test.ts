import WebSocket from "ws";
import {
  connectClient,
  initiateWebSocketServer,
  waitForClose,
} from "#src/tests/setup/websocket-utils.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";

describe("authorization", () => {
  beforeAll(() => {
    initiateWebSocketServer();
  });

  it("should send 1008 close code when token is invalid", async () => {
    expect.hasAssertions();

    const ws = new WebSocket("ws://localhost:8080?token=invalid-token");
    const { code, reason } = await waitForClose(ws);

    expect(code).toBe(1008);
    expect(reason).toBe("Access token is missing or invalid.");
  });

  it("should accept connection when token is valid", async () => {
    expect.hasAssertions();

    const user = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    const token = issueJwt(user.id, "10m");
    const ws = await connectClient(token);

    expect(ws.readyState).toBe(WebSocket.OPEN);
  });
});
