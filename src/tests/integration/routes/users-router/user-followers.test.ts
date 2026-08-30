import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import issueJwt from "#src/utils/issue-jwt.js";
import * as userFollowsQueries from "#src/queries/user-follows-queries.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { FollowersResponse, PublicUser } from "#src/types/routes/users.js";

describe("/users/:userId/followers endpoint", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  interface JsonFollowersResponse {
    followers: (Omit<PublicUser, "lastSeen"> & { lastSeen: string })[];
  }

  describe("create follower POST", () => {
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
        .post("/users/nonExistingId/followers")
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "No user to follow was found.",
          },
        ],
      });
    });

    it("should return 204 status when request is valid", async () => {
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
      const userAToken = issueJwt(userA.id, "10m");

      const response = await request(app)
        .post(`/users/${userB.id}/followers`)
        .auth(userAToken, { type: "bearer" });

      expect(response.noContent).toBe(true);
    });
  });

  describe("get followers GET", () => {
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
        .get("/users/nonExistingId/followers")
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "User not found.",
          },
        ],
      });
    });

    it("should return 200 status with followers count when count query parameter is passed", async () => {
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
      const userAToken = issueJwt(userA.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .get(`/users/${userB.id}/followers?count=true`)
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<FollowersResponse>({
        count: 1,
      });
    });

    it("should return 200 status with an array of followers when count is not true", async () => {
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
      const userAToken = issueJwt(userA.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .get(`/users/${userB.id}/followers?count=invalid`)
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<JsonFollowersResponse>({
        followers: [
          {
            id: userA.id,
            fullName: "test: userA",
            isOnline: false,
            lastSeen: expect.any(String) as string,
            picture: null,
          },
        ],
      });
    });

    it("should return 200 status with an array of followers when count is missing", async () => {
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
      const userAToken = issueJwt(userA.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .get(`/users/${userB.id}/followers`)
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<JsonFollowersResponse>({
        followers: [
          {
            id: userA.id,
            fullName: "test: userA",
            isOnline: false,
            lastSeen: expect.any(String) as string,
            picture: null,
          },
        ],
      });
    });
  });

  describe("delete follower DELETE", () => {
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
        .delete("/users/nonExistingId/followers")
        .auth(userAToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "No user to unfollow was found.",
          },
        ],
      });
    });

    it("should return 204 status when request is valid", async () => {
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
      const userAToken = issueJwt(userA.id, "10m");
      await userFollowsQueries.followUser(userA.id, userB.id);

      const response = await request(app)
        .delete(`/users/${userB.id}/followers`)
        .auth(userAToken, { type: "bearer" });

      expect(response.noContent).toBe(true);
    });
  });
});
