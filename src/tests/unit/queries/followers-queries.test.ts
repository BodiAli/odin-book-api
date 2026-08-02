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

    it("should create a new follower for expected user", async () => {
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
      const userANotFollowsUserB = await prisma.user.findUnique({
        where: {
          following: {
            some: {
              id: userB.id,
            },
          },
          id: userA.id,
        },
      });

      await followersQueries.followUser(userA.id, userB.id);
      const userAFollowsUserB = await prisma.user.findUnique({
        where: {
          following: {
            some: {
              id: userB.id,
            },
          },
          id: userA.id,
        },
      });

      expect(userANotFollowsUserB).toBeNull();
      expect(userAFollowsUserB).not.toBeNull();
    });
  });
});
