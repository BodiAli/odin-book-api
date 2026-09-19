import Clients from "#src/websocket/clients.js";
import type WebSocket from "ws";

describe("clients class", () => {
  beforeEach(() => {
    Reflect.set(Clients, "instance", null);
  });

  describe("constructor", () => {
    it("should throw an error when creating more than one instance", () => {
      expect.hasAssertions();

      new Clients();

      expect(() => {
        new Clients();
      }).toThrow(
        new Error("Use Clients.getInstance() to get the clients instance."),
      );
    });
  });

  describe("get instance", () => {
    it("should create a new instance if none exists", () => {
      expect.hasAssertions();

      new Clients();

      const clients = Clients.getInstance();

      expect(clients).toBeDefined();
    });

    it("should return the existing instance if it exists", () => {
      expect.hasAssertions();

      const clients1 = Clients.getInstance();
      const clients2 = Clients.getInstance();

      expect(clients1).toBe(clients2);
    });
  });

  describe("createUserConnection", () => {
    it("should throw an error when user has a connection", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      instance.createUserConnection(userId);

      expect(() => {
        instance.createUserConnection(userId);
      }).toThrow(new Error("User already has a connection established."));
    });

    it("should create an array of clients to user", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";

      instance.createUserConnection(userId);
      const userClients = instance.getUserClients(userId);

      expect(userClients).toStrictEqual([]);
    });
  });

  describe("insertClient", () => {
    it("should throw an error when inserting a client to a non-existing user connection", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      const ws = {} as WebSocket;

      expect(() => {
        instance.insertClient(userId, ws);
      }).toThrow(new Error("No user connection is found."));
    });

    it("should return true when inserting a client to an existing user connection", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      const ws = {} as WebSocket;
      instance.createUserConnection(userId);

      const isInserted = instance.insertClient(userId, ws);

      expect(isInserted).toBe(true);
    });

    it("should insert new client to user's clients", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      const ws = {} as WebSocket;
      instance.createUserConnection(userId);

      instance.insertClient(userId, ws);

      expect(instance.clients).toHaveLength(1);
      expect(instance.clients).toHaveLength(1);
      expect(instance.getUserClients(userId)).toStrictEqual([{}]);
    });
  });

  describe("getUserClients", () => {
    it("should return an empty array when user connection has no clients", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      instance.createUserConnection(userId);

      const userClients = instance.getUserClients(userId);

      expect(userClients).toStrictEqual([]);
    });

    it("should return an array of user's clients", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      instance.createUserConnection(userId);
      const ws1 = {} as WebSocket;
      const ws2 = {} as WebSocket;
      instance.insertClient(userId, ws1);
      instance.insertClient(userId, ws2);

      const userClients = instance.getUserClients(userId);

      expect(userClients).toStrictEqual([{}, {}]);
    });

    it("should throw an error when user has no connection", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";

      expect(() => {
        instance.getUserClients(userId);
      }).toThrow(new Error("No user connection is found."));
    });
  });

  describe("hasConnection", () => {
    it("should return false when user has no connection", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();

      const isConnected = instance.hasConnection("test-userId");

      expect(isConnected).toBe(false);
    });

    it("should return false when user has no clients connected", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      instance.createUserConnection(userId);

      const isConnected = instance.hasConnection(userId);

      expect(isConnected).toBe(false);
    });

    it("should return true when user has a connection established", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      instance.createUserConnection(userId);
      const ws = {} as WebSocket;
      instance.insertClient(userId, ws);

      const isConnected = instance.hasConnection(userId);

      expect(isConnected).toBe(true);
    });
  });

  describe("removeConnection", () => {
    it("should remove user client", () => {
      expect.hasAssertions();

      const instance = Clients.getInstance();
      const userId = "test-userId";
      const ws1 = { OPEN: 1 } as WebSocket;
      const ws2 = { CLOSED: 3 } as WebSocket;
      instance.createUserConnection(userId);
      instance.insertClient(userId, ws1);
      instance.insertClient(userId, ws2);

      instance.removeConnection(userId, ws2);
      const userClients = instance.getUserClients(userId);

      expect(userClients).toStrictEqual([{ OPEN: 1 }]);
    });
  });

  it("should remove the user connection when removing the last user client", () => {
    expect.hasAssertions();

    const instance = Clients.getInstance();
    const userId = "test-userId";
    const ws1 = { OPEN: 1 } as WebSocket;
    const ws2 = { CLOSED: 3 } as WebSocket;
    instance.createUserConnection(userId);
    instance.insertClient(userId, ws1);
    instance.insertClient(userId, ws2);

    instance.removeConnection(userId, ws2);
    instance.removeConnection(userId, ws1);

    expect(() => {
      instance.getUserClients(userId);
    }).toThrow(new Error("No user connection is found."));
  });
});
