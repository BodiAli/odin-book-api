import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import issueJwt from "#src/utils/issue-jwt.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

describe("/notifications path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  interface JsonNotificationsResponse {
    notifications: (Omit<SentNotification, "createdAt"> & {
      createdAt: string;
    })[];
  }

  describe("get current user notifications GET", () => {
    it("should return 200 status with current user notifications", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const userB = await userQueries.createUserLocal({
        email: "userB@test.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const userC = await userQueries.createUserLocal({
        email: "userC@test.com",
        fullName: "test: userC",
        password: "test-userC-password",
      });
      const userAProfileId = await profileQueries.getProfileId(userA.id);
      const userCPost = await postQueries.createPost({
        title: "test: userC post title",
        content: "test: userC post content",
        imageId: null,
        imageUrl: null,
        userId: userC.id,
      });
      const userBComment = await commentQueries.createComment({
        content: "test: userB comment content",
        userId: userB.id,
        postId: userCPost.id,
      });
      await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userC.id,
        type: "FOLLOW",
      });
      await notificationQueries.createNotification({
        actorId: userB.id,
        notifierId: userC.id,
        type: "COMMENT",
        commentId: userBComment.id,
      });
      const userCToken = issueJwt(userC.id, "10m");

      const response = await request(app)
        .get("/notifications")
        .auth(userCToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<JsonNotificationsResponse>({
        notifications: [
          {
            id: expect.any(String) as string,
            actorProfilePicture: userB.picture,
            createdAt: expect.any(String) as string,
            message:
              'test: userB commented on your post "test: userC post title"',
            actorId: userB.id,
            target: {
              type: "COMMENT",
              postId: userCPost.id,
              commentId: userBComment.id,
            },
          },
          {
            id: expect.any(String) as string,
            actorProfilePicture: userB.picture,
            createdAt: expect.any(String) as string,
            message: "test: userA started following you.",
            actorId: userA.id,
            target: {
              type: "FOLLOW",
              profileId: userAProfileId,
            },
          },
        ],
      });
    });
  });
});
