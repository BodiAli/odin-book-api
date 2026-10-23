import * as notificationQueries from "#src/queries/notification-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import prisma from "#src/db/prisma-client.js";
import type { SentNotification } from "#src/types/routes/notifications.js";
import type { User } from "#src/types/routes/users.js";
import type { NotificationModel } from "#src/generated/prisma/models.js";

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

    await profileQueries.createOrUpdateProfilePicture(userA.id, userAImageUrl);
    await profileQueries.createOrUpdateProfilePicture(userB.id, userBImageUrl);
    await profileQueries.createOrUpdateProfilePicture(userC.id, userCImageUrl);
  });

  describe(notificationQueries.createNotification, () => {
    it("should assign entity id to profile id when notification type is 'FOLLOW'", async () => {
      expect.hasAssertions();

      const userAProfile = await prisma.profile.findUniqueOrThrow({
        where: {
          userId: userA.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
        entityId: userAProfile.id,
      });
      const notification = await prisma.notification.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(notification.profileId).toBe(userAProfile.id);
      expect(notification.commentId).toBeNull();
      expect(notification.postId).toBeNull();
    });

    it("should assign entity id to post id when notification type is 'COMMENT'", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "COMMENT",
        entityId: userBPost.id,
      });
      const notification = await prisma.notification.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(notification.postId).toBe(userBPost.id);
      expect(notification.profileId).toBeNull();
      expect(notification.commentId).toBeNull();
    });

    it("should assign entity id to comment id when notification type is 'REPLY'", async () => {
      expect.hasAssertions();

      const userAPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userA.id,
        },
      });
      const userBComment = await prisma.comment.create({
        data: {
          userId: userB.id,
          postId: userAPost.id,
          content: "test: comment content",
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "REPLY",
        entityId: userBComment.id,
      });
      const notification = await prisma.notification.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(notification.commentId).toBe(userBComment.id);
      expect(notification.profileId).toBeNull();
      expect(notification.postId).toBeNull();
    });

    it("should create a notification", async () => {
      expect.hasAssertions();

      const userAProfile = await prisma.profile.findUniqueOrThrow({
        where: {
          userId: userA.id,
        },
      });

      const createdNotification = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
        entityId: userAProfile.id,
      });
      const notification = await prisma.notification.findUnique({
        where: {
          id: createdNotification.id,
        },
      });

      expect(notification).toStrictEqual<NotificationModel>({
        actorId: userA.id,
        notifierId: userB.id,
        createdAt: expect.any(Date) as Date,
        id: createdNotification.id,
        commentId: null,
        postId: null,
        profileId: userAProfile.id,
        type: "FOLLOW",
      });
    });

    it("should throw an error when passing an entity id that does not match the type", async () => {
      expect.hasAssertions();

      const userAProfile = await prisma.profile.findUniqueOrThrow({
        where: {
          userId: userA.id,
        },
      });

      await expect(
        notificationQueries.createNotification({
          actorId: userA.id,
          notifierId: userB.id,
          entityId: userAProfile.id,
          type: "COMMENT",
        }),
      ).rejects.toThrow(new Error("Foreign key constraint failed."));
    });
  });

  describe(notificationQueries.getUserNotifications, () => {
    it("should return user notifications ordered by newest", async () => {
      expect.hasAssertions();

      const userAProfile = await prisma.profile.findUniqueOrThrow({
        where: {
          userId: userA.id,
        },
      });
      const userCPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userC.id,
        },
      });
      const notificationCreatedByUserA =
        await notificationQueries.createNotification({
          actorId: userA.id,
          notifierId: userC.id,
          type: "FOLLOW",
          entityId: userAProfile.id,
        });
      const notificationCreatedByUserB =
        await notificationQueries.createNotification({
          actorId: userB.id,
          notifierId: userC.id,
          type: "COMMENT",
          entityId: userCPost.id,
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
      expect(userCNotifications).toStrictEqual<SentNotification[]>([
        {
          id: notificationCreatedByUserB.id,
          actorProfilePicture: userBImageUrl,
          message: 'test: userB commented on your post "test: post title"',
          type: "COMMENT",
          createdAt: expect.any(Date) as Date,
          actorId: userB.id,
          entityId: userCPost.id,
        },
        {
          id: notificationCreatedByUserA.id,
          actorProfilePicture: userAImageUrl,
          message: "test: userA started following you.",
          type: "FOLLOW",
          createdAt: expect.any(Date) as Date,
          actorId: userA.id,
          entityId: userAProfile.id,
        },
      ]);
    });
  });

  describe.only(notificationQueries.getSentNotification, () => {
    it("should throw an error when notification is not found", async () => {
      expect.hasAssertions();

      await expect(
        notificationQueries.getSentNotification("non-existing-id"),
      ).rejects.toThrow(new Error("Notification not found."));
    });

    it("should return the structure of notification sent to the end user", async () => {
      expect.hasAssertions();
    });
  });
});
