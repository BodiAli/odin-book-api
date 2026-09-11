import * as userQueries from "#src/queries/user-queries.js";
import {
  connectClient,
  initiateWebSocketServer,
  waitForClose,
} from "#src/tests/setup/websocket-utils.js";
import issueJwt from "#src/utils/issue-jwt.js";

describe("send notification", () => {
  beforeAll(() => {
    initiateWebSocketServer();
  });

  it("should close connection with code 1007 when received message is invalid", async () => {
    expect.hasAssertions();

    const currentUser = await userQueries.createUserLocal({
      email: "test-emasil@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    const token = issueJwt(currentUser.id, "10m");
    const ws = await connectClient(token);
    ws.send("invalid JSON");

    const { code, reason } = await waitForClose(ws);

    expect(code).toBe(1007);
    expect(reason).toBe("Invalid JSON");
  });

  it.todo("send notification...");
});
