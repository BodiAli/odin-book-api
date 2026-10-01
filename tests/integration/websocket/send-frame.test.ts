import utils from "#test-utils/websocket-utils.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import Clients from "#src/websocket/clients.js";
import sendFrame from "#src/websocket/send-frame.js";
import { EventType } from "#src/types/websocket/event-type.js";
import type { ServerDataFrame } from "#src/types/websocket/data-frames.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

describe("sending frame", () => {
  beforeEach(async () => {
    await utils.initiateWebSocketServer();
  });

  afterEach(async () => {
    await utils.cleanupConnection();
  });

  it("should not send a frame to a client that is not OPEN", async () => {
    expect.hasAssertions();

    const user = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    const token = issueJwt(user.id);
    const ws = await utils.connectClient(token);
    const clients = Clients.getInstance();
    const client = clients.getUserClients(user.id)[0];
    assert(client);
    client.close();
    const waitForMessagePromise = utils.waitForMessage(ws);

    sendFrame(user.id, {
      success: true,
      type: EventType.NOTIFICATION,
      data: {
        actorProfilePicture: null,
        createdAt: new Date(),
        id: "test-notification-id",
        message: "test: message",
        type: "FOLLOW",
      },
    });

    await expect(waitForMessagePromise).rejects.toThrow(
      new Error("No message received"),
    );
  });

  it("should send frame to all user clients", async () => {
    expect.hasAssertions();

    const user = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    const token = issueJwt(user.id);
    const ws1 = await utils.connectClient(token);
    const ws2 = await utils.connectClient(token);
    const serverFrame: ServerDataFrame = {
      type: EventType.NOTIFICATION,
      success: true,
      data: {
        actorProfilePicture: null,
        createdAt: new Date(),
        id: "test-notification-id",
        message: "test: message",
        type: "FOLLOW",
      },
    };

    const waitForWs1Message = utils.waitForMessage<ServerDataFrame>(ws1);
    const waitForWs2Message = utils.waitForMessage<ServerDataFrame>(ws2);
    sendFrame(user.id, serverFrame);
    const ws1Message = await waitForWs1Message;
    const ws2Message = await waitForWs2Message;
    const jsonResponse: Omit<SentNotification, "createdAt"> & {
      createdAt: string;
    } = {
      ...serverFrame.data,
      createdAt: serverFrame.data.createdAt.toISOString(),
    };

    expect(ws1Message.data).toStrictEqual(jsonResponse);
    expect(ws2Message.data).toStrictEqual(jsonResponse);
  });
});
