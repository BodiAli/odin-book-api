import utils from "#test-utils/websocket-utils.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import Clients from "#src/websocket/clients.js";
import prisma from "#src/db/prisma-client.js";

describe("websocket connection", () => {
  beforeEach(async () => {
    await utils.initiateWebSocketServer();
  });

  afterEach(async () => {
    await utils.cleanupConnection();
  });

  describe("client connection", () => {
    it("should create user connection and add new connected client", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      await utils.connectClient(userAToken);

      expect(clients.hasConnection(userA.id)).toBe(true);
      expect(clients.getUserClients(userA.id)).toHaveLength(1);
    });

    it("should add multiple clients to the same user when the user connects using multiple clients", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      await utils.connectClient(userAToken);
      await utils.connectClient(userAToken);
      await utils.connectClient(userAToken);

      expect(clients.hasConnection(userA.id)).toBe(true);
      expect(clients.getUserClients(userA.id)).toHaveLength(3);
    });

    it("should handle connecting multiple users", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const userB = await userQueries.createUserLocal({
        email: "userB@test.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      const userBToken = issueJwt(userB.id);
      await utils.connectClient(userAToken);
      await utils.connectClient(userBToken);

      const isUserAConnected = clients.hasConnection(userA.id);
      const isUserBConnected = clients.hasConnection(userB.id);

      expect(isUserAConnected).toBe(true);
      expect(isUserBConnected).toBe(true);
    });

    it("should handle adding multiple clients to multiple users", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const userB = await userQueries.createUserLocal({
        email: "userB@test.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      const userBToken = issueJwt(userB.id);
      await utils.connectClient(userAToken);
      await utils.connectClient(userBToken);
      await utils.connectClient(userBToken);

      const userAClients = clients.getUserClients(userA.id);
      const userBClients = clients.getUserClients(userB.id);

      expect(userAClients).toHaveLength(1);
      expect(userBClients).toHaveLength(2);
    });

    it("should update user to be online", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          isOnline: false,
        },
      });
      const token = issueJwt(user.id);

      await utils.connectClient(token);
      const isOnline = await vi.waitUntil(async () => {
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        assert(updatedUser);

        return updatedUser.isOnline;
      });

      expect(isOnline).toBe(true);
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
          setImmediate(resolve);
        });
      }
    }

    it("should remove client for the connected user when connection closes abnormally", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const clients = Clients.getInstance();
      const userAToken = issueJwt(userA.id);
      const ws1UserA = await utils.connectClient(userAToken);

      ws1UserA.terminate();
      await waitForClientRemoval(clients, 0);

      expect(clients.clients).toHaveLength(0);
    });

    it("should update user to be offline", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          isOnline: true,
        },
      });
      const token = issueJwt(user.id);
      const ws = await utils.connectClient(token);

      ws.close();
      const isOffline = await vi.waitUntil(async () => {
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        assert(updatedUser);

        return !updatedUser.isOnline;
      });

      expect(isOffline).toBe(true);
    });

    it("should not update the user to be offline if there is at least one connected client", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          isOnline: true,
        },
      });
      const token = issueJwt(user.id);
      const ws = await utils.connectClient(token);
      await utils.connectClient(token);

      ws.close();

      await expect(
        vi.waitUntil(async () => {
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
          assert(updatedUser);

          return !updatedUser.isOnline;
        }),
      ).rejects.toThrow(new Error("Timed out in waitUntil!"));
    });
  });
});
