import {
  connectClient,
  initiateWebSocketServer,
} from "#test-utils/websocket-utils.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import Clients from "#src/websocket/clients.js";
import type { User } from "#src/types/routes/users.js";

describe("websocket connection", () => {
  let userA: User;
  let userB: User;

  beforeAll(() => {
    initiateWebSocketServer();
  });

  beforeEach(async () => {
    userA = await userQueries.createUserLocal({
      email: "userA@test.com",
      fullName: "test: userA",
      password: "test-userA-password",
    });
    userB = await userQueries.createUserLocal({
      email: "userB@test.com",
      fullName: "test: userB",
      password: "test-userB-password",
    });
  });

  afterEach(() => {
    const clientsInstance = Clients.getInstance();
    for (const ws of clientsInstance.clients) {
      ws.close();
    }
  });

  describe("client connection", () => {
    it("should create user connection and add new connected client", async () => {
      expect.hasAssertions();

      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      await connectClient(userAToken);

      expect(clients.hasConnection(userA.id)).toBe(true);
      expect(clients.getUserClients(userA.id)).toHaveLength(1);
    });

    it("should add multiple clients to the same user when the user connects using multiple clients", async () => {
      expect.hasAssertions();

      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      await connectClient(userAToken);
      await connectClient(userAToken);
      await connectClient(userAToken);

      expect(clients.hasConnection(userA.id)).toBe(true);
      expect(clients.getUserClients(userA.id)).toHaveLength(3);
    });

    it("should handle connecting multiple users", async () => {
      expect.hasAssertions();

      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      const userBToken = issueJwt(userB.id);
      await connectClient(userAToken);
      await connectClient(userBToken);

      const isUserAConnected = clients.hasConnection(userA.id);
      const isUserBConnected = clients.hasConnection(userB.id);

      expect(isUserAConnected).toBe(true);
      expect(isUserBConnected).toBe(true);
    });

    it("should handle adding multiple clients to multiple users", async () => {
      expect.hasAssertions();

      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      const userBToken = issueJwt(userB.id);
      await connectClient(userAToken);
      await connectClient(userBToken);
      await connectClient(userBToken);

      const userAClients = clients.getUserClients(userA.id);
      const userBClients = clients.getUserClients(userB.id);

      expect(userAClients).toHaveLength(1);
      expect(userBClients).toHaveLength(2);
    });
  });

  describe("client disconnection", () => {
    async function waitForClientRemoval(
      clientsInstance: Clients,
      length: number,
    ): Promise<void> {
      const now = Date.now();
      while (clientsInstance.clients.length !== length) {
        if (Date.now() - now >= 1000) {
          throw new Error("Client was not removed.");
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      }
    }

    it("should remove client for the connected user when connection closes abnormally", async () => {
      expect.hasAssertions();

      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      const ws1UserA = await connectClient(userAToken);

      ws1UserA.terminate();
      await waitForClientRemoval(clients, 0);

      expect(clients.clients).toHaveLength(0);
    });
  });
});
