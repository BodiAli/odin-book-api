import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { googleOauth2Verify } from "#src/services/auth-service.js";
import prisma from "#src/lib/prisma-client.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { Profile, VerifyCallback } from "passport-google-oauth20";

describe("auth-service", () => {
  interface ProfileData {
    _json: Pick<
      Required<Profile["_json"]>,
      "sub" | "email" | "name" | "picture"
    >;
  }

  const profileData: ProfileData = {
    _json: {
      sub: "test-userId",
      email: "test-email@test.com",
      name: "test: full name",
      picture: "test-image-url",
    },
  };

  const doneMock = vi.fn<VerifyCallback>(() => {
    // empty
  });

  const googleOauth2VerifyArguments = [
    "accessToken",
    "refreshToken",
    profileData as Profile,
    doneMock,
  ] as const;

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("given a non-existing user", () => {
    it("should create a new user and call the done function with expected arguments", async () => {
      expect.hasAssertions();

      const userNotExists = await prisma.user.findUnique({
        where: {
          id: "test-userId",
        },
      });

      await googleOauth2Verify(...googleOauth2VerifyArguments);
      const userExists = await prisma.user.findUnique({
        where: {
          id: "test-userId",
        },
      });

      expect(userNotExists).toBeNull();
      expect(userExists).not.toBeNull();
      expect(doneMock).toHaveBeenCalledExactlyOnceWith(null, {
        ...userExists,
        picture: "test-image-url",
      });
    });
  });

  describe("given an already existing user", () => {
    it("should call the done function with the user object", async () => {
      expect.hasAssertions();

      const createUserGoogleMock = vi.spyOn(userQueries, "createUserGoogle");
      const existingUser = await prisma.user.create({
        data: {
          email: profileData._json.email,
          fullName: profileData._json.name,
          id: profileData._json.sub,
          provider: "google",
          password: null,
        },
      });

      await googleOauth2Verify(...googleOauth2VerifyArguments);

      expect(doneMock).toHaveBeenCalledExactlyOnceWith(null, {
        ...existingUser,
        picture: "test-image-url",
      });
      expect(createUserGoogleMock).not.toHaveBeenCalled();
    });

    it("should update the existing user profile picture", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: profileData._json.email,
          fullName: profileData._json.name,
          id: profileData._json.sub,
          password: null,
          provider: "google",
          profile: {
            create: {
              imageUrl: "test-image-url-1",
            },
          },
        },
      });

      await googleOauth2Verify(...googleOauth2VerifyArguments);
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

      expect(user.profile.imageUrl).toBe(profileData._json.picture);
    });
  });

  describe("given an error is thrown", () => {
    it("should call done with that error", async () => {
      expect.hasAssertions();

      vi.spyOn(userQueries, "getUserById").mockImplementation(() => {
        throw new Error("test: error");
      });

      await googleOauth2Verify(...googleOauth2VerifyArguments);

      expect(doneMock).toHaveBeenCalledExactlyOnceWith(
        new Error("test: error"),
        false,
      );
    });
  });
});
