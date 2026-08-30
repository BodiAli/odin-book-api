import { beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import issueJwt from "#src/utils/issue-jwt.js";
import * as userFollowsQueries from "#src/queries/user-follows-queries.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type {
  FollowingsResponse,
  PublicUser,
} from "#src/types/routes/users.js";

describe("/users/:userId/followings endpoint", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  interface JsonFollowingsResponse {
    followings: (Omit<PublicUser, "lastSeen"> & { lastSeen: string })[];
  }

  describe("get followings GET", () => {
    it("should return 404 status with error message when target user does not exist", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      const userAToken = issueJwt(userA.id, "10m");

      const response = await request(app)
        .get("/users/nonExistingId/followings")
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "User not found." }],
      });
    });

    it("should return 200 status with followings count when count query parameter is passed", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      const userBToken = issueJwt(userB.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .get(`/users/${userA.id}/followings?count=true`)
        .auth(userBToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<FollowingsResponse>({
        count: 1,
      });
    });

    it("should return 200 status with an array of followings when count is not true", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      const userBToken = issueJwt(userB.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .get(`/users/${userA.id}/followings?count=invalid`)
        .auth(userBToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<JsonFollowingsResponse>({
        followings: [
          {
            id: userB.id,
            fullName: "test: userB",
            isOnline: false,
            lastSeen: expect.any(String) as string,
            picture: null,
          },
        ],
      });
    });

    it("should return 200 status with an array of followings when count is missing", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      const userBToken = issueJwt(userB.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .get(`/users/${userA.id}/followings`)
        .auth(userBToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<JsonFollowingsResponse>({
        followings: [
          {
            id: userB.id,
            fullName: "test: userB",
            isOnline: false,
            lastSeen: expect.any(String) as string,
            picture: null,
          },
        ],
      });
    });
  });
});
