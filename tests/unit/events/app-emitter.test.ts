import appEmitter from "#src/events/app-emitter.js";
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
    appEmitter.removeListeners();
    vi.resetAllMocks();
  });

  describe("listenForNotification", () => {
    it("should listen for 'notification' event", () => {
      expect.hasAssertions();

      appEmitter.listenForNotification();
      const listeners = appEmitter.listeners("notification");

      expect(listeners).toHaveLength(1);
    });
  });

  describe("listeners", () => {
    it("should return an array of listeners for the given event", () => {
      expect.hasAssertions();

      appEmitter.listenForNotification();
      const notificationListeners = appEmitter.listeners("notification");
      const otherListeners = appEmitter.listeners("other");

      expect(notificationListeners).toHaveLength(1);
      expect(otherListeners).toHaveLength(0);
    });
  });

  describe("emitNotification", () => {
    it("should emit the notification event with notification argument", () => {
      expect.hasAssertions();

      appEmitter.listenForNotification();
      const notification = {
        id: "test-notificationId",
        actorId: "test-actorId",
        actorName: "test: actorName",
        createdAt: new Date(),
        notifierId: "test-notifierId",
        type: "FOLLOW" as const,
      };
      appEmitter.emitNotification(notification);

      expect(sendNotification).toHaveBeenCalledExactlyOnceWith(notification);
    });
  });

  describe("removeListeners", () => {
    it("should remove all registered listeners", () => {
      expect.hasAssertions();

      appEmitter.listenForNotification();

      appEmitter.removeListeners();

      expect(appEmitter.listeners("notification")).toHaveLength(0);
    });
  });
});
