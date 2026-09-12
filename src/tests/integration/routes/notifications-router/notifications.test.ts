import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import issueJwt from "#src/utils/issue-jwt.js";
import * as notificationQueries from "#src/queries/notification-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

describe("/notifications endpoint", () => {
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
    it("should 200 status with current user notifications", async () => {
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
      await notificationQueries.createNotification({
        actorId: userA.id,
        notifierId: userC.id,
        type: "FOLLOW",
      });
      await notificationQueries.createNotification({
        actorId: userB.id,
        notifierId: userC.id,
        type: "FOLLOW",
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
            message: "test: userB started following you.",
            type: "FOLLOW",
          },
          {
            id: expect.any(String) as string,
            actorProfilePicture: userB.picture,
            createdAt: expect.any(String) as string,
            message: "test: userA started following you.",
            type: "FOLLOW",
          },
        ],
      });
    });
  });
});
