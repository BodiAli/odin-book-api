import { describe, expect, it } from "vitest";
import * as followersQueries from "#src/queries/followers-queries.js";
import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";

describe("followers-queries", () => {
  describe(followersQueries.followUser, () => {
    it("should throw a CustomHttpStatusError when passing a non-existing user id", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });

      await expect(
        followersQueries.followUser(userA.id, "non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "User not found."));
    });

    it("should throw a CustomHttpStatusError when current user tries to follow themselves", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });

      await expect(
        followersQueries.followUser(userA.id, userA.id),
      ).rejects.toThrow(
        new CustomHttpStatusError(400, "You cannot follow yourself."),
      );
    });

    it("should throw CustomHttpStatusError when user tries to follow the same user twice", async () => {
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

      await followersQueries.followUser(userA.id, userB.id);

      await expect(
        followersQueries.followUser(userA.id, userB.id),
      ).rejects.toThrow(
        new CustomHttpStatusError(409, "You already follow test: userB."),
      );
    });

    it("should allow a user to follow another user", async () => {
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
      const userANotFollowsUserB = await prisma.userFollow.findUnique({
        where: {
          followedById_followingId: {
            followedById: userA.id,
            followingId: userB.id,
          },
        },
      });

      await followersQueries.followUser(userA.id, userB.id);
      const userAFollowsUserB = await prisma.userFollow.findUnique({
        where: {
          followedById_followingId: {
            followedById: userA.id,
            followingId: userB.id,
          },
        },
      });

      expect(userANotFollowsUserB).toBeNull();
      expect(userAFollowsUserB).not.toBeNull();
    });
  });
});
