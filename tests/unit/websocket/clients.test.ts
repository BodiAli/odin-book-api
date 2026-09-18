import Clients from "#src/websocket/clients.js";

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

  describe("get clients", () => {
    it.todo(
      "should return map of clients where each key is an array of websockets",
      () => {},
    );
  });
});
