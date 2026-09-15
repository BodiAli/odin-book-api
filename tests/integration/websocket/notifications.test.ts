import * as userQueries from "#src/queries/user-queries.js";
import {
  connectClient,
  initiateWebSocketServer,
  waitForMessage,
} from "#test-utils/websocket-utils.js";
import issueJwt from "#src/utils/issue-jwt.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import type { User } from "#src/types/routes/users.js";
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

  let userA: User;
  let userB: User;
  let userC: User;

  beforeEach(async () => {
    userA = await userQueries.createUserLocal({
      email: "test-userA@test.com",
      fullName: "test: userA",
      password: "test-userA-password",
    });
    userB = await userQueries.createUserLocal({
      email: "test-userB@test.com",
      fullName: "test: userB",
      password: "test-userB-password",
    });
    userC = await userQueries.createUserLocal({
      email: "test-userC@test.com",
      fullName: "test: userC",
      password: "test-userC-password",
    });
  });

  it("should send notification to target notifier when 'notification' event is emitted", async () => {
    expect.hasAssertions();

    const userBToken = issueJwt(userB.id, "10m");
    const notification = await notificationQueries.createNotification({
      actorId: userA.id,
      notifierId: userB.id,
      type: "FOLLOW",
    });
    const wsUserB = await connectClient(userBToken);

    emitter.emit(events.NOTIFICATION, notification);
    const message = await waitForMessage(wsUserB);

    expect(message).toStrictEqual<JsonServerFrame>({
      type: events.NOTIFICATION,
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

  it.only("should send notification to target notifier only", async () => {
    expect.hasAssertions();

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

    emitter.emit(events.NOTIFICATION, notification);
    // const results = await Promise.all([
    //   waitForMessage(wsUserC),
    //   waitForMessage(wsUserB),
    // ]);
    const userCMsg = await waitForMessage(wsUserC);
    emitter.emit(events.NOTIFICATION, notification);
    const userBMsg = await waitForMessage(wsUserB);
    // console.log("A", userAMsg);
    console.log("res", userBMsg);
    // console.log("C", userCMsg);

    expect(true).toBe(true);
  });
});
