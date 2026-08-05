import { beforeEach, describe, expect, it } from "vitest";
import * as followersQueries from "#src/queries/followers-queries.js";
import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { UserModel } from "#src/generated/prisma/models.js";
import type { PublicUser } from "#src/types/routes/users.js";

describe("followers-queries", () => {
  describe(followersQueries.followUser, () => {
    it("should throw a CustomHttpStatusError when the target user does not exist", async () => {
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

  describe(followersQueries.getNumOfFollowers, () => {
    let userA: Omit<UserModel, "password">;
    let userB: Omit<UserModel, "password">;
    let userC: Omit<UserModel, "password">;

    beforeEach(async () => {
      userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      userC = await prisma.user.create({
        data: {
          email: "test-userC@test.com",
          fullName: "test: userC",
        },
      });

      await followersQueries.followUser(userA.id, userC.id);
      await followersQueries.followUser(userB.id, userC.id);

      await followersQueries.followUser(userA.id, userB.id);
    });

    it("should throw a CustomHttpStatus error when the target user does not exist", async () => {
      expect.hasAssertions();

      await expect(
        followersQueries.getNumOfFollowers("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "User not found."));
    });

    it("should return the number of followers of target user", async () => {
      expect.hasAssertions();

      const userANumOfFollowers = await followersQueries.getNumOfFollowers(
        userA.id,
      );
      const userBNumOfFollowers = await followersQueries.getNumOfFollowers(
        userB.id,
      );
      const userCNumOfFollowers = await followersQueries.getNumOfFollowers(
        userC.id,
      );

      expect(userANumOfFollowers).toBe(0);
      expect(userBNumOfFollowers).toBe(1);
      expect(userCNumOfFollowers).toBe(2);
    });
  });

  describe(followersQueries.getNumOfFollowing, () => {
    let userA: Omit<UserModel, "password">;
    let userB: Omit<UserModel, "password">;
    let userC: Omit<UserModel, "password">;

    beforeEach(async () => {
      userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      userC = await prisma.user.create({
        data: {
          email: "test-userC@test.com",
          fullName: "test: userC",
        },
      });

      await followersQueries.followUser(userA.id, userC.id);
      await followersQueries.followUser(userB.id, userC.id);

      await followersQueries.followUser(userA.id, userB.id);
    });

    it("should throw a CustomHttpStatus error when the target user does not exist", async () => {
      expect.hasAssertions();

      await expect(
        followersQueries.getNumOfFollowing("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "User not found."));
    });

    it("should return the number of followings of target user", async () => {
      expect.hasAssertions();

      const userANumOfFollowings = await followersQueries.getNumOfFollowing(
        userA.id,
      );
      const userBNumOfFollowings = await followersQueries.getNumOfFollowing(
        userB.id,
      );
      const userCNumOfFollowings = await followersQueries.getNumOfFollowing(
        userC.id,
      );

      expect(userANumOfFollowings).toBe(2);
      expect(userBNumOfFollowings).toBe(1);
      expect(userCNumOfFollowings).toBe(0);
    });
  });

  describe(followersQueries.getFollowers, () => {
    let userA: Omit<UserModel, "password">;
    let userB: Omit<UserModel, "password">;
    let userC: Omit<UserModel, "password">;

    beforeEach(async () => {
      userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      userC = await prisma.user.create({
        data: {
          email: "test-userC@test.com",
          fullName: "test: userC",
        },
      });

      await followersQueries.followUser(userA.id, userC.id);
      await followersQueries.followUser(userB.id, userC.id);

      await followersQueries.followUser(userA.id, userB.id);
    });

    it("should throw a CustomHttpStatus error when the target user does not exist", async () => {
      expect.hasAssertions();

      await expect(
        followersQueries.getFollowers("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "User not found."));
    });

    it("should return the followers of target user", async () => {
      expect.hasAssertions();

      const userAFollowers = await followersQueries.getFollowers(userA.id);
      const userBFollowers = await followersQueries.getFollowers(userB.id);
      const userCFollowers = await followersQueries.getFollowers(userC.id);

      expect(userAFollowers).toHaveLength(0);
      expect(userBFollowers).toStrictEqual<PublicUser[]>([
        {
          fullName: "test: userA",
          id: userA.id,
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
      ]);
      expect(userCFollowers).toStrictEqual<PublicUser[]>([
        {
          fullName: "test: userA",
          id: userA.id,
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
        {
          fullName: "test: userB",
          id: userB.id,
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
      ]);
    });
  });

  describe(followersQueries.getFollowings, () => {
    let userA: Omit<UserModel, "password">;
    let userB: Omit<UserModel, "password">;
    let userC: Omit<UserModel, "password">;

    beforeEach(async () => {
      userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });
      userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });
      userC = await prisma.user.create({
        data: {
          email: "test-userC@test.com",
          fullName: "test: userC",
        },
      });

      await followersQueries.followUser(userA.id, userC.id);
      await followersQueries.followUser(userB.id, userC.id);

      await followersQueries.followUser(userA.id, userB.id);
    });

    it("should throw a CustomHttpStatus error when the target user does not exist", async () => {
      expect.hasAssertions();

      await expect(
        followersQueries.getFollowings("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "User not found."));
    });

    it("should return the followings of target user", async () => {
      expect.hasAssertions();

      const userAFollowings = await followersQueries.getFollowings(userA.id);
      const userBFollowings = await followersQueries.getFollowings(userB.id);
      const userCFollowings = await followersQueries.getFollowings(userC.id);

      expect(userAFollowings).toStrictEqual<PublicUser[]>([
        {
          fullName: "test: userB",
          id: userB.id,
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
        {
          fullName: "test: userC",
          id: userC.id,
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
      ]);
      expect(userBFollowings).toStrictEqual<PublicUser[]>([
        {
          fullName: "test: userC",
          id: userC.id,
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
      ]);
      expect(userCFollowings).toHaveLength(0);
    });
  });

  describe(followersQueries.unfollowUser, () => {
    it("should throw a CustomHttpStatus error when target user does not", async () => {
      expect.hasAssertions();

      const userA = await prisma.user.create({
        data: {
          email: "test-userA@test.com",
          fullName: "test: userA",
        },
      });

      await expect(
        followersQueries.unfollowUser(userA.id, "non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "User not found."));
    });

    it("should unfollow target user", async () => {
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
      const userC = await prisma.user.create({
        data: {
          email: "test-userC@test.com",
          fullName: "test: userC",
        },
      });

      await followersQueries.followUser(userA.id, userC.id);
      await followersQueries.followUser(userB.id, userC.id);

      await followersQueries.unfollowUser(userA.id, userC.id);
      const userCFollowers = await followersQueries.getFollowers(userC.id);

      expect(userCFollowers).toStrictEqual<PublicUser[]>([
        {
          id: userB.id,
          fullName: "test: userB",
          isOnline: false,
          lastSeen: expect.any(Date) as Date,
          picture: null,
        },
      ]);
    });
  });
});
