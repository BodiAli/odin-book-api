import * as notificationQueries from "#src/queries/notification-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import prisma from "#src/db/prisma-client.js";
import type { Notification } from "#src/types/routes/notifications.js";
import type { User } from "#src/types/routes/users.js";

describe("notification queries", () => {
  let userA: User;
  let userB: User;
  let userC: User;

  const userAImageUrl = "test-image-url-userC";
  const userBImageUrl = null;
  const userCImageUrl = "test-image-url-userC";

  beforeEach(async () => {
    userA = await userQueries.createUserLocal({
      email: "userA@test.com",
      fullName: "test: userA",
      password: "test: password",
    });
    userB = await userQueries.createUserLocal({
      email: "userB@test.com",
      fullName: "test: userB",
      password: "test: password",
    });
    userC = await userQueries.createUserLocal({
      email: "userC@test.com",
      fullName: "test: userC",
      password: "test: password",
    });

    await profileQueries.createProfile({
      userId: userA.id,
      description: null,
      imageUrl: userAImageUrl,
    });
    await profileQueries.createProfile({
      userId: userB.id,
      description: null,
      imageUrl: userBImageUrl,
    });
    await profileQueries.createProfile({
      userId: userC.id,
      description: null,
      imageUrl: userCImageUrl,
    });
  });

  describe(notificationQueries.createNotification, () => {
    it("should create a notification", async () => {
      expect.hasAssertions();

      const createdNotification = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
      });

      const notification = await prisma.notification.findUnique({
        where: {
          id: createdNotification.id,
        },
      });
      assert(notification);

      expect(notification).toBeDefined();
    });
  });

  describe(notificationQueries.getUserNotifications, () => {
    it("should return user notifications ordered by newest", async () => {
      expect.hasAssertions();

      const notificationCreatedByUserA =
        await notificationQueries.createNotification({
          actorId: userA.id,
          notifierId: userC.id,
          type: "FOLLOW",
        });
      const notificationCreatedByUserB =
        await notificationQueries.createNotification({
          actorId: userB.id,
          notifierId: userC.id,
          type: "FOLLOW",
        });

      const userANotifications = await notificationQueries.getUserNotifications(
        userA.id,
      );
      const userBNotifications = await notificationQueries.getUserNotifications(
        userB.id,
      );
      const userCNotifications = await notificationQueries.getUserNotifications(
        userC.id,
      );

      expect(userANotifications).toHaveLength(0);
      expect(userBNotifications).toHaveLength(0);
      expect(userCNotifications).toStrictEqual<Notification[]>([
        {
          id: notificationCreatedByUserB.id,
          actorProfilePicture: userBImageUrl,
          message: "test: userB started following you.",
          type: "FOLLOW",
          createdAt: expect.any(Date) as Date,
        },
        {
          id: notificationCreatedByUserA.id,
          actorProfilePicture: userAImageUrl,
          message: "test: userA started following you.",
          type: "FOLLOW",
          createdAt: expect.any(Date) as Date,
        },
      ]);
    });
  });
});
