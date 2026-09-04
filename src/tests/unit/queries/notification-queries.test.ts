import * as notificationQueries from "#src/queries/notification-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import prisma from "#src/db/prisma-client.js";
import type { Notification } from "#src/types/routes/notifications.js";
import type { User } from "#src/types/routes/users.js";
import type {
  NotificationModel,
  ProfileModel,
} from "#src/generated/prisma/models.js";

describe("notification queries", () => {
  let userA: User;
  let userB: User;
  let userC: User;

  let userAProfile: ProfileModel;
  let userBProfile: ProfileModel;
  let userCProfile: ProfileModel;

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

    userAProfile = await profileQueries.createProfile({
      userId: userA.id,
      description: null,
      imageUrl: "test-image-url-userA",
    });
    userBProfile = await profileQueries.createProfile({
      userId: userB.id,
      description: null,
      imageUrl: null,
    });
    userCProfile = await profileQueries.createProfile({
      userId: userC.id,
      description: null,
      imageUrl: "test-image-url-userC",
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

      expect(notification).toStrictEqual<NotificationModel>({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
        id: notification.id,
      });
    });
  });

  describe(notificationQueries.getUserNotifications, () => {
    it("should return user notifications", async () => {
      expect.hasAssertions();

      await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
      });
      await notificationQueries.createNotification({
        actorId: userA.id,
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
      expect(userBNotifications).toStrictEqual<Notification[]>([
        {
          id: expect.any(String) as string,
          actorProfilePicture: null,
          message: "test: userA started following you.",
        },
      ]);
      expect(userCNotifications).toStrictEqual<Notification[]>([
        {
          id: expect.any(String) as string,
          actorProfilePicture: userCProfile.imageUrl,
          message: "test: userA started following you.",
        },
      ]);
    });
  });
});
