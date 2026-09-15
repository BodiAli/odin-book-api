import * as userQueries from "#src/queries/user-queries.js";
import {
  connectClient,
  initiateWebSocketServer,
  waitForMessage,
} from "#test-utils/websocket-utils.js";
import issueJwt from "#src/utils/issue-jwt.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import appEmitter from "#src/events/app-emitter.js";
import { EventType } from "#src/types/websocket/event-type.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

describe("send notification with WebSocketApp, AppEmitter, and sendNotification service", () => {
  beforeAll(() => {
    initiateWebSocketServer();
  });

  interface JsonSentNotification extends Omit<SentNotification, "createdAt"> {
    createdAt: string;
  }
  interface JsonServerFrame extends Omit<ServerDataFrame, "data"> {
    data: JsonSentNotification;
  }

  it("should send notification to target notifier when 'notification' event is emitted", async () => {
    expect.hasAssertions();

    const userA = await userQueries.createUserLocal({
      email: "test-userA@test.com",
      fullName: "test: userA",
      password: "test-userA-password",
    });
    const userB = await userQueries.createUserLocal({
      email: "test-userB@test.com",
      fullName: "test: userB",
      password: "test-userB-password",
    });
    const userBToken = issueJwt(userB.id, "10m");
    const notification = await notificationQueries.createNotification({
      actorId: userA.id,
      notifierId: userB.id,
      type: "FOLLOW",
    });
    const wsUserB = await connectClient(userBToken);

    appEmitter.emitNotification(notification);
    const message = await waitForMessage(wsUserB);

    expect(message).toStrictEqual<JsonServerFrame>({
      type: EventType.NOTIFICATION,
      success: true,
      data: {
        id: notification.id,
        actorProfilePicture: userA.picture,
        createdAt: notification.createdAt.toISOString(),
        type: notification.type,
        message: "test: userA started following you.",
      },
    });
  });
});
