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
    vi.resetAllMocks();
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
      appEmitter.listenForNotification();
      appEmitter.emitNotification(notification);
      appEmitter.emitNotification(notification);

      expect(sendNotification).toHaveBeenCalledTimes(1);
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
});
