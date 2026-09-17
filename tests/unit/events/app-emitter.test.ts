import AppEmitter from "#src/events/app-emitter.js";
import sendNotification from "#src/services/send-notification.js";
import type { NotificationModel } from "#src/types/routes/notifications.js";

vi.mock(import("#src/services/send-notification.js"), () => {
  return {
    default: vi.fn<(notification: NotificationModel) => Promise<void>>(
      async (_notification): Promise<void> => {
        // empty
      },
    ),
  };
});

describe("app-emitter class", () => {
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
    it("should listen for 'notification' event once", () => {
      expect.hasAssertions();

      const notification = {
        id: "test-notificationId",
        actorId: "test-actorId",
        actorName: "test: actorName",
        createdAt: new Date(),
        notifierId: "test-notifierId",
        type: "FOLLOW" as const,
      };
      AppEmitter.getInstance().listenForNotification();
      AppEmitter.getInstance().emitNotification(notification);
      AppEmitter.getInstance().emitNotification(notification);

      expect(sendNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe("emitNotification", () => {
    it("should emit the notification event with notification argument", () => {
      expect.hasAssertions();

      AppEmitter.getInstance().listenForNotification();
      const notification = {
        id: "test-notificationId",
        actorId: "test-actorId",
        actorName: "test: actorName",
        createdAt: new Date(),
        notifierId: "test-notifierId",
        type: "FOLLOW" as const,
      };
      AppEmitter.getInstance().emitNotification(notification);

      expect(sendNotification).toHaveBeenCalledExactlyOnceWith(notification);
    });
  });
});
