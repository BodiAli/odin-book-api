import * as userQueries from "#src/queries/user-queries.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import sendNotification from "#src/services/send-notification.js";
import issueJwt from "#src/utils/issue-jwt.js";
import { EventType } from "#src/types/websocket/event-type.js";
import {
  connectClient,
  initiateWebSocketServer,
  waitForMessage,
} from "#test-utils/websocket-utils.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

describe("send notification", () => {
  beforeAll(() => {
    initiateWebSocketServer();
  });

  interface JsonSentNotification extends Omit<SentNotification, "createdAt"> {
    createdAt: string;
  }
  interface JsonServerFrame extends Omit<ServerDataFrame, "data"> {
    data: JsonSentNotification;
  }

  it("should send notification to target notifier", async () => {
    expect.hasAssertions();

    const actor = await userQueries.createUserLocal({
      email: "test-actor@test.com",
      fullName: "test: actor",
      password: "test-actor",
    });
    const notifier = await userQueries.createUserLocal({
      email: "test-notifier@test.com",
      fullName: "test: notifier",
      password: "test-notifier",
    });
    const notification = await notificationQueries.createNotification({
      actorId: actor.id,
      notifierId: notifier.id,
      type: "FOLLOW",
    });
    const notifierToken = issueJwt(notifier.id, "10m");
    const ws = await connectClient(notifierToken);

    await sendNotification(notification);
    const notifierMsg = await waitForMessage(ws);

    expect(notifierMsg).toStrictEqual<JsonServerFrame>({
      type: EventType.NOTIFICATION,
      success: true,
      data: {
        id: notification.id,
        createdAt: notification.createdAt.toISOString(),
        actorProfilePicture: actor.picture,
        message: "test: actor started following you.",
        type: "FOLLOW",
      },
    });
  });

  it("should send notification to only the target notifier", async () => {
    expect.hasAssertions();

    const userA = await userQueries.createUserLocal({
      email: "test-userA@email.com",
      fullName: "test: userA",
      password: "test-userA",
    });
    const userB = await userQueries.createUserLocal({
      email: "test-userB@email.com",
      fullName: "test: userB",
      password: "test-userB",
    });
    const userC = await userQueries.createUserLocal({
      email: "test-userC@email.com",
      fullName: "test: userC",
      password: "test-userC",
    });
    const notification = await notificationQueries.createNotification({
      actorId: userA.id,
      notifierId: userB.id,
      type: "FOLLOW",
    });
    const userAToken = issueJwt(userA.id, "10m");
    const userBToken = issueJwt(userB.id, "10m");
    const userCToken = issueJwt(userC.id, "10m");
    const wsUserA = await connectClient(userAToken);
    const wsUserB = await connectClient(userBToken);
    const wsUserC = await connectClient(userCToken);
    const userAPromise = waitForMessage(wsUserA, 200);
    const userBPromise = waitForMessage(wsUserB, 200);
    const userCPromise = waitForMessage(wsUserC, 200);

    await sendNotification(notification);

    await expect(userAPromise).rejects.toStrictEqual(
      new Error("No message received"),
    );
    await expect(userCPromise).rejects.toStrictEqual(
      new Error("No message received"),
    );
    await expect(userBPromise).resolves.toStrictEqual({
      type: EventType.NOTIFICATION,
      success: true,
      data: {
        id: notification.id,
        createdAt: notification.createdAt.toISOString(),
        actorProfilePicture: userA.picture,
        message: "test: userA started following you.",
        type: "FOLLOW",
      },
    });
  });
});
