import * as userQueries from "#src/queries/user-queries.js";
import {
  connectClient,
  initiateWebSocketServer,
  waitForClose,
  waitForMessage,
} from "#test-utils/websocket-utils.js";
import issueJwt from "#src/utils/issue-jwt.js";
import { emitter, events } from "#src/events/index.js";
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
  });

  it("should close connection with code 1007 when received message is invalid", async () => {
    expect.hasAssertions();

    const userAToken = issueJwt(userA.id, "10m");
    const ws = await connectClient(userAToken);
    ws.send("invalid JSON");

    const { code, reason } = await waitForClose(ws);

    expect(code).toBe(1007);
    expect(reason).toBe("Invalid JSON");
  });

  it("should send notification to target notifier", async () => {
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
        createdAt: expect.any(String) as string,
        type: notification.type,
        message: "test: userA started following you.",
      },
    });
  });
});
