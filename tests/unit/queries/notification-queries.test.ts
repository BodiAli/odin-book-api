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
    it("should set commentId to null when type is 'FOLLOW'", async () => {
      expect.hasAssertions();

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
      });
      const notification = await prisma.notification.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(notification.commentId).toBeNull();
    });

    it("should set commentId when type is 'COMMENT'", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const comment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          userId: userA.id,
          postId: userBPost.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "COMMENT",
        commentId: comment.id,
      });
      const notification = await prisma.notification.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(notification.commentId).toBe(comment.id);
    });

    it("should set commentId when type is 'REPLY'", async () => {
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
      const userAReply = await prisma.comment.create({
        data: {
          userId: userA.id,
          postId: userAPost.id,
          content: "test: reply content",
          parentId: userBComment.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "REPLY",
        commentId: userAReply.id,
      });
      const notification = await prisma.notification.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(notification.commentId).toBe(userAReply.id);
    });

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

      expect(notification).toStrictEqual<NotificationModel>({
        actorId: userA.id,
        notifierId: userB.id,
        createdAt: expect.any(Date) as Date,
        id: createdNotification.id,
        commentId: null,
        type: "FOLLOW",
      });
    });

    it("should throw an error when passing comment id that violates a foreign key constraint", async () => {
      expect.hasAssertions();

      await expect(
        notificationQueries.createNotification({
          actorId: userA.id,
          notifierId: userB.id,
          type: "COMMENT",
          commentId: "non-existing-id",
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
      const userBComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userCPost.id,
          userId: userB.id,
        },
      });
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
          type: "COMMENT",
          commentId: userBComment.id,
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
          createdAt: expect.any(Date) as Date,
          actorId: userB.id,
          target: {
            type: "COMMENT",
            commentId: userBComment.id,
            postId: userCPost.id,
          },
        },
        {
          id: notificationCreatedByUserA.id,
          actorProfilePicture: userAImageUrl,
          message: "test: userA started following you.",
          createdAt: expect.any(Date) as Date,
          actorId: userA.id,
          target: {
            type: "FOLLOW",
            profileId: userAProfile.id,
          },
        },
      ]);
    });

    it("should return notification with target including actor's profile id when type is 'FOLLOW'", async () => {
      expect.hasAssertions();

      const userAProfile = await prisma.profile.findFirstOrThrow({
        where: {
          userId: userA.id,
        },
      });
      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
      });

      const userBNotifications = await notificationQueries.getUserNotifications(
        userB.id,
      );

      expect(userBNotifications).toStrictEqual<SentNotification[]>([
        {
          id,
          actorId: userA.id,
          actorProfilePicture: userAImageUrl,
          createdAt: expect.any(Date) as Date,
          message: "test: userA started following you.",
          target: {
            profileId: userAProfile.id,
            type: "FOLLOW",
          },
        },
      ]);
    });

    it("should return notifications with target including post id and comment id when type is 'COMMENT'", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const userAComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userBPost.id,
          userId: userA.id,
        },
      });
      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "COMMENT",
        commentId: userAComment.id,
      });

      const userBNotifications = await notificationQueries.getUserNotifications(
        userB.id,
      );

      expect(userBNotifications).toStrictEqual<SentNotification[]>([
        {
          id,
          actorId: userA.id,
          actorProfilePicture: userAImageUrl,
          createdAt: expect.any(Date) as Date,
          message: 'test: userA commented on your post "test: post title"',
          target: {
            commentId: userAComment.id,
            postId: userBPost.id,
            type: "COMMENT",
          },
        },
      ]);
    });

    it("should return notifications with target including post id, comment id, and parent comment id when type is 'REPLY'", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const userCComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userBPost.id,
          userId: userC.id,
        },
      });
      const userAReply = await prisma.comment.create({
        data: {
          content: "test: reply content",
          postId: userBPost.id,
          userId: userA.id,
          parentId: userCComment.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userC.id,
        type: "REPLY",
        commentId: userAReply.id,
      });

      const userCNotifications = await notificationQueries.getUserNotifications(
        userC.id,
      );

      expect(userCNotifications).toStrictEqual<SentNotification[]>([
        {
          id,
          actorId: userA.id,
          actorProfilePicture: userAImageUrl,
          createdAt: expect.any(Date) as Date,
          message:
            'test: userA replied to your comment "test: comment content"',
          target: {
            commentId: userAReply.id,
            parentCommentId: userCComment.id,
            postId: userBPost.id,
            type: "REPLY",
          },
        },
      ]);
    });

    it("should return notifications when replying to a reply", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const userCComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userBPost.id,
          userId: userC.id,
        },
      });
      const userBReply = await prisma.comment.create({
        data: {
          content: "test: reply1 content",
          postId: userBPost.id,
          userId: userB.id,
          parentId: userCComment.id,
        },
      });
      const userAReply = await prisma.comment.create({
        data: {
          content: "test: reply2 content",
          postId: userBPost.id,
          userId: userA.id,
          parentId: userBReply.id,
        },
      });
      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "REPLY",
        commentId: userAReply.id,
      });

      const userBNotifications = await notificationQueries.getUserNotifications(
        userB.id,
      );

      expect(userBNotifications).toStrictEqual<SentNotification[]>([
        {
          id,
          actorId: userA.id,
          actorProfilePicture: userAImageUrl,
          createdAt: expect.any(Date) as Date,
          message: 'test: userA replied to your comment "test: reply1 content"',
          target: {
            commentId: userAReply.id,
            parentCommentId: userBReply.id,
            postId: userBPost.id,
            type: "REPLY",
          },
        },
      ]);
    });
  });

  describe(notificationQueries.getSentNotification, () => {
    it("should throw an error when notification is not found", async () => {
      expect.hasAssertions();

      await expect(
        notificationQueries.getSentNotification("non-existing-id"),
      ).rejects.toThrow(new Error("Notification not found."));
    });

    it("should return notification with target including actor's profile id when type is 'FOLLOW'", async () => {
      expect.hasAssertions();

      const userAProfile = await prisma.profile.findFirstOrThrow({
        where: {
          userId: userA.id,
        },
      });
      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "FOLLOW",
      });

      const sentNotification =
        await notificationQueries.getSentNotification(id);

      expect(sentNotification).toStrictEqual<SentNotification>({
        id,
        actorId: userA.id,
        actorProfilePicture: userAImageUrl,
        createdAt: expect.any(Date) as Date,
        message: "test: userA started following you.",
        target: {
          profileId: userAProfile.id,
          type: "FOLLOW",
        },
      });
    });

    it("should return notification with target including post id and comment id when type is 'COMMENT'", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const userAComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userBPost.id,
          userId: userA.id,
        },
      });
      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "COMMENT",
        commentId: userAComment.id,
      });

      const sentNotification =
        await notificationQueries.getSentNotification(id);

      expect(sentNotification).toStrictEqual<SentNotification>({
        id,
        actorId: userA.id,
        actorProfilePicture: userAImageUrl,
        createdAt: expect.any(Date) as Date,
        message: 'test: userA commented on your post "test: post title"',
        target: {
          commentId: userAComment.id,
          postId: userBPost.id,
          type: "COMMENT",
        },
      });
    });

    it("should return notification with target including post id, comment id, and parent comment id when type is 'REPLY'", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const userCComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userBPost.id,
          userId: userC.id,
        },
      });
      const userAReply = await prisma.comment.create({
        data: {
          content: "test: reply content",
          postId: userBPost.id,
          userId: userA.id,
          parentId: userCComment.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "REPLY",
        commentId: userAReply.id,
      });

      const sentNotification =
        await notificationQueries.getSentNotification(id);

      expect(sentNotification).toStrictEqual<SentNotification>({
        id,
        actorId: userA.id,
        actorProfilePicture: userAImageUrl,
        createdAt: expect.any(Date) as Date,
        message: 'test: userA replied to your comment "test: comment content"',
        target: {
          commentId: userAReply.id,
          parentCommentId: userCComment.id,
          postId: userBPost.id,
          type: "REPLY",
        },
      });
    });

    it("should return notification when replying to a reply", async () => {
      expect.hasAssertions();

      const userBPost = await prisma.post.create({
        data: {
          title: "test: post title",
          content: "test: post content",
          userId: userB.id,
        },
      });
      const userCComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: userBPost.id,
          userId: userC.id,
        },
      });
      const userBReply = await prisma.comment.create({
        data: {
          content: "test: reply1 content",
          postId: userBPost.id,
          userId: userB.id,
          parentId: userCComment.id,
        },
      });
      const userAReply = await prisma.comment.create({
        data: {
          content: "test: reply2 content",
          postId: userBPost.id,
          userId: userA.id,
          parentId: userBReply.id,
        },
      });

      const { id } = await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userB.id,
        type: "REPLY",
        commentId: userAReply.id,
      });

      const sentNotification =
        await notificationQueries.getSentNotification(id);

      expect(sentNotification).toStrictEqual<SentNotification>({
        id,
        actorId: userA.id,
        actorProfilePicture: userAImageUrl,
        createdAt: expect.any(Date) as Date,
        message: 'test: userA replied to your comment "test: reply1 content"',
        target: {
          commentId: userAReply.id,
          parentCommentId: userBReply.id,
          postId: userBPost.id,
          type: "REPLY",
        },
      });
    });
  });
});
