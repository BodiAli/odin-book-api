import { assert, describe, expect, it, vi } from "vitest";
import { getOrCreateOauth2User } from "#src/services/oauth2-authenticate.js";
import prisma from "#src/db/prisma-client.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { User } from "#src/types/routes/users.js";
import type { Oauth2UserData } from "#src/types/routes/auth.js";

describe("oauth2 service", () => {
  describe("given a non-existing user", () => {
    it("should create a new user and return it", async () => {
      expect.hasAssertions();

      const userData: Oauth2UserData = {
        email: "test-email@test.com",
        name: "test: full name",
        picture: "test-image-url",
      };
      const userNotExists = await prisma.user.findUnique({
        where: {
          email: userData.email,
        },
      });

      const returnedUser = await getOrCreateOauth2User(userData, "google");
      const userExists = await prisma.user.findUnique({
        where: {
          email: userData.email,
        },
      });

      expect(userNotExists).toBeNull();
      expect(userExists).not.toBeNull();
      expect(returnedUser).toStrictEqual<User>({
        id: expect.any(String) as string,
        email: userData.email,
        fullName: userData.name,
        picture: userData.picture,
        provider: "google",
        isOnline: true,
        isGuest: false,
      });
    });
  });

  describe("given an already existing user", () => {
    it("should return the existing user object", async () => {
      expect.hasAssertions();

      const createUserOauthMock = vi.spyOn(userQueries, "createUserOauth");
      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name 1",
          provider: "local",
          password: "test: password",
        },
      });

      const returnedUser = await getOrCreateOauth2User(
        {
          email: createdUser.email,
          name: "test: full name 2",
          picture: "test-image-url",
        },
        "github",
      );

      expect(returnedUser.id).toBe(createdUser.id);
      expect(createUserOauthMock).not.toHaveBeenCalled();
    });

    it("should update the existing user profile picture", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          id: "test-userId-2",
          password: "test: password",
          provider: "local",
          profile: {
            create: {
              imageUrl: "test-image-url-1",
            },
          },
        },
      });
      const userData: Oauth2UserData = {
        email: "test-email@test.com",
        name: "test: full name",
        picture: "test-image-url-2",
      };

      await getOrCreateOauth2User(userData, "google");
      const user = await prisma.user.findUnique({
        where: {
          id: createdUser.id,
        },
        select: {
          profile: {
            select: {
              imageUrl: true,
            },
          },
        },
      });
      assert(user?.profile);

      expect(user.profile.imageUrl).toBe(userData.picture);
    });
  });
});
