import AppEmitter from "#src/events/app-emitter.js";
import sendNotification from "#src/services/send-notification.js";

vi.mock(import("#src/services/send-notification.js"), () => {
  return {
    default: vi.fn<() => Promise<void>>(async (): Promise<void> => {
      // empty
    }),
  };
});

describe("app-emitter class", () => {
  beforeEach(() => {
    Reflect.set(AppEmitter, "instance", null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getInstance", () => {
    it("should create a new instance if none exists", () => {
      expect.hasAssertions();

      const instance = AppEmitter.getInstance();

      expect(instance).toBeDefined();
    });

    it("should return the existing instance if it exists", () => {
      expect.hasAssertions();

      const instance1 = AppEmitter.getInstance();
      const instance2 = AppEmitter.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("listenForNotification", () => {
    it("should listen for 'notification' event", () => {
      expect.hasAssertions();

      const notification = {
        id: "test-notificationId",
        notifierId: "test-notifierId",
      };
      AppEmitter.getInstance().listenForNotification();
      AppEmitter.getInstance().emitNotification(
        notification.notifierId,
        notification.id,
      );
      AppEmitter.getInstance().emitNotification(
        notification.notifierId,
        notification.id,
      );

      expect(sendNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe("emitNotification", () => {
    it("should emit the notification event with notification argument", () => {
      expect.hasAssertions();

      AppEmitter.getInstance().listenForNotification();
      const notification = {
        id: "test-notificationId",
        notifierId: "test-notifierId",
      };
      AppEmitter.getInstance().emitNotification(
        notification.notifierId,
        notification.id,
      );

      expect(sendNotification).toHaveBeenCalledExactlyOnceWith(
        notification.notifierId,
        notification.id,
      );
    });
  });
});
