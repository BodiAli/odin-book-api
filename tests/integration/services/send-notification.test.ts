import * as userQueries from "#src/queries/user-queries.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import sendNotification from "#src/services/send-notification.js";
import issueJwt from "#src/utils/issue-jwt.js";
import { EventType } from "#src/types/websocket/event-type.js";
import utils from "#test-utils/websocket-utils.js";
import sendFrame from "#src/websocket/send-frame.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

vi.mock(import("#src/websocket/send-frame.js"), { spy: true });

describe("send notification", () => {
  beforeEach(async () => {
    await utils.initiateWebSocketServer();
  });

  afterEach(async () => {
    vi.resetAllMocks();
    await utils.cleanupConnection();
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
    const ws = await utils.connectClient(notifierToken);

    await sendNotification(notification);
    const notifierMsg = await utils.waitForMessage(ws);

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
      email: "test-userA@test.com",
      fullName: "test: userA",
      password: "test-userA",
    });
    const userB = await userQueries.createUserLocal({
      email: "test-userB@test.com",
      fullName: "test: userB",
      password: "test-userB",
    });
    const userC = await userQueries.createUserLocal({
      email: "test-userC@test.com",
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
    const wsUserA = await utils.connectClient(userAToken);
    const wsUserB = await utils.connectClient(userBToken);
    const wsUserC = await utils.connectClient(userCToken);
    const userAPromise = utils.waitForMessage(wsUserA, 200);
    const userBPromise = utils.waitForMessage(wsUserB, 200);
    const userCPromise = utils.waitForMessage(wsUserC, 200);

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

  it("should send notification to all clients of target notifier", async () => {
    expect.hasAssertions();

    const actor = await userQueries.createUserLocal({
      email: "test-actor@test.com",
      fullName: "test: actor",
      password: "test-actor-password",
    });
    const notifier = await userQueries.createUserLocal({
      email: "test-notifier@test.com",
      fullName: "test: notifier",
      password: "test-notifier-password",
    });
    const notification = await notificationQueries.createNotification({
      actorId: actor.id,
      notifierId: notifier.id,
      type: "FOLLOW",
    });
    const notifierToken = issueJwt(notifier.id);
    const ws1Notifier = await utils.connectClient(notifierToken);
    const ws2Notifier = await utils.connectClient(notifierToken);
    const ws3Notifier = await utils.connectClient(notifierToken);
    const ws1MsgPromise = utils.waitForMessage(ws1Notifier);
    const ws2MsgPromise = utils.waitForMessage(ws2Notifier);
    const ws3MsgPromise = utils.waitForMessage(ws3Notifier);

    await sendNotification(notification);
    const ws1Msg = await ws1MsgPromise;
    const ws2Msg = await ws2MsgPromise;
    const ws3Msg = await ws3MsgPromise;
    const notificationDataFrame: JsonServerFrame = {
      success: true,
      type: EventType.NOTIFICATION,
      data: {
        id: notification.id,
        type: "FOLLOW",
        actorProfilePicture: actor.picture,
        createdAt: notification.createdAt.toISOString(),
        message: "test: actor started following you.",
      },
    };

    expect(ws1Msg).toStrictEqual(notificationDataFrame);
    expect(ws2Msg).toStrictEqual(notificationDataFrame);
    expect(ws3Msg).toStrictEqual(notificationDataFrame);
  });

  it("should not send to target notifier when target notifier has no connection", async () => {
    expect.hasAssertions();

    const notifier = await userQueries.createUserLocal({
      email: "test-notifier@test.com",
      fullName: "test: notifier",
      password: "test-notifier-password",
    });
    const actor = await userQueries.createUserLocal({
      email: "test-actor@test.com",
      fullName: "test: actor",
      password: "test-actor-password",
    });
    const notification = await notificationQueries.createNotification({
      actorId: actor.id,
      notifierId: notifier.id,
      type: "FOLLOW",
    });

    await sendNotification(notification);

    expect(sendFrame).not.toHaveBeenCalled();
  });
});
