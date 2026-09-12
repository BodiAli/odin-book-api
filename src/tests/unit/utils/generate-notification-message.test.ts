import generateNotificationMessage from "#src/utils/generate-notification-message.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as notificationQueries from "#src/queries/notification-queries.js";

describe(generateNotificationMessage, () => {
  it("should generate a notification when type is 'FOLLOW'", async () => {
    expect.hasAssertions();

    const userA = await userQueries.createUserLocal({
      email: "userA@test.com",
      fullName: "test: userA",
      password: "test: password",
    });
    const userB = await userQueries.createUserLocal({
      email: "userB@test.com",
      fullName: "test: userB",
      password: "test: password",
    });

    const notification = await notificationQueries.createNotification({
      actorId: userA.id,
      notifierId: userB.id,
      type: "FOLLOW",
    });
    const followNotification = generateNotificationMessage({
      actorName: notification.actorName,
      entityId: null,
      type: notification.type,
    });

    expect(followNotification).toBe("test: userA started following you.");
  });

  it.todo("should generate a notification when type is 'COMMENT'");
});
