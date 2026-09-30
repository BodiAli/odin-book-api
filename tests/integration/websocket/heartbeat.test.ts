import Clients from "#src/websocket/clients.js";
import utils from "#test-utils/websocket-utils.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { User } from "#src/types/routes/users.js";

describe("heartbeat mechanism", () => {
  let user: User;

  beforeEach(async () => {
    user = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    vi.useFakeTimers();
    utils.initiateWebSocketServer();
  });

  afterEach(() => {
    vi.useRealTimers();
    const clientsInstance = Clients.getInstance();
    for (const client of clientsInstance.clients) {
      client.close();
    }
    utils.closeServer();
  });

  it("should send ping client every 30 seconds", async () => {
    expect.hasAssertions();

    const token = issueJwt(user.id);
    const ws = await utils.connectClient(token, false);
    let pings = 0;
    ws.on("ping", () => {
      pings++;
    });

    // use async to wait for asynchronous code to execute
    // first iteration
    await vi.advanceTimersByTimeAsync(30000);
    ws.pong();
    // second iteration
    await vi.advanceTimersByTimeAsync(30000);

    expect(pings).toBe(2);
  });

  it("should remove client when client doesn't respond to the ping", async () => {
    expect.hasAssertions();

    const clientsInstance = Clients.getInstance();
    const token = issueJwt(user.id);
    await utils.connectClient(token, false);

    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(30000);
    const userClients = clientsInstance.clients;
    const isUserConnected = clientsInstance.hasConnection(user.id);

    expect(userClients).toHaveLength(0);
    expect(isUserConnected).toBe(false);
  });

  it("should remove all clients that are not responding", async () => {
    expect.hasAssertions();

    const clientsInstance = Clients.getInstance();
    const token = issueJwt(user.id);
    await utils.connectClient(token, false);
    await utils.connectClient(token, false);

    await vi.advanceTimersByTimeAsync(30000);
    await vi.advanceTimersByTimeAsync(30000);
    const userClients = clientsInstance.clients;
    const isUserConnected = clientsInstance.hasConnection(user.id);

    expect(userClients).toHaveLength(0);
    expect(isUserConnected).toBe(false);
  });

  it("should not remove client when client responds to ping with pong", async () => {
    expect.hasAssertions();

    const clientsInstance = Clients.getInstance();
    const token = issueJwt(user.id);
    const ws = await utils.connectClient(token, false);

    // first iteration
    await vi.advanceTimersByTimeAsync(30000);
    ws.pong();
    // second iteration
    await vi.advanceTimersByTimeAsync(30000);
    const userClients = clientsInstance.clients;
    const isUserConnected = clientsInstance.hasConnection(user.id);

    expect(userClients).toHaveLength(1);
    expect(isUserConnected).toBe(true);
  });

  it("should only remove the client that is not responding", async () => {
    expect.hasAssertions();

    const clientsInstance = Clients.getInstance();
    const token = issueJwt(user.id);
    const ws1 = await utils.connectClient(token, false);
    const ws2 = await utils.connectClient(token, false);

    // first iteration
    await vi.advanceTimersByTimeAsync(30000);
    ws1.pong();
    // second iteration
    await vi.advanceTimersByTimeAsync(30000);
    // use real timers so the timer in waitForClose will run
    vi.useRealTimers();
    const { code } = await utils.waitForClose(ws2);
    const userClients = clientsInstance.clients;
    const isUserConnected = clientsInstance.hasConnection(user.id);

    expect(userClients).toHaveLength(1);
    expect(isUserConnected).toBe(true);
    expect(code).toBe(1006);
  });
});
