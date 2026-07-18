import { assert, describe, expect, it, vi } from "vitest";
import { googleOauth2 } from "#src/services/google-oauth2-authenticate.js";
import prisma from "#src/lib/prisma-client.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { User } from "#src/types/current-user.js";
import type { Oauth2UserData } from "#src/types/auth.js";

describe("google oauth2 service", () => {
  describe("given a non-existing user", () => {
    it("should create a new user and return it", async () => {
      expect.hasAssertions();

      const userData: Oauth2UserData = {
        email: "test-email@test.com",
        name: "test: full name",
        picture: "test-image-url",
        sub: "test-userId",
      };
      const userNotExists = await prisma.user.findUnique({
        where: {
          id: userData.sub,
        },
      });

      const returnedUser = await googleOauth2(userData);
      const userExists = await prisma.user.findUnique({
        where: {
          id: "test-userId",
        },
      });

      expect(userNotExists).toBeNull();
      expect(userExists).not.toBeNull();
      expect(returnedUser).toStrictEqual<User>({
        id: userData.sub,
        email: userData.email,
        fullName: userData.name,
        picture: userData.picture,
        provider: "google",
        isOnline: true,
      });
    });
  });

  describe("given an already existing user", () => {
    it("should return the existing user object", async () => {
      expect.hasAssertions();

      const createUserGoogleMock = vi.spyOn(userQueries, "createUserGoogle");
      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name 1",
          id: "test-userId",
          provider: "local",
          password: "test: password",
        },
      });

      const returnedUser = await googleOauth2({
        email: createdUser.email,
        name: "test: full name 2",
        picture: "test-image-url",
        sub: "test-userId",
      });

      expect(returnedUser.id).toBe(createdUser.id);
      expect(createUserGoogleMock).not.toHaveBeenCalled();
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
        sub: "test-userId-1",
      };

      await googleOauth2(userData);
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
