import { afterEach, describe, expect, it, vi } from "vitest";
import { googleOauth2Verify } from "#src/services/auth-service.js";
import prisma from "#src/lib/prisma-client.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import type { User } from "#src/schemas/users/user-schema.js";

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

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("given a non-existing user", () => {
    it("should create a new user and call the done function with expected arguments", async () => {
      expect.hasAssertions();

      const doneMock = vi.fn<VerifyCallback>(() => {
        // empty
      });
      const userNotExists = await prisma.user.findUnique({
        where: {
          id: "test-userId",
        },
      });

      await googleOauth2Verify(
        "accessToken",
        "refreshToken",
        profileData as Profile,
        doneMock,
      );
      const userExists = await prisma.user.findUnique({
        where: {
          id: "test-userId",
        },
      });

      expect(userNotExists).toBeNull();
      expect(userExists).toStrictEqual<User>({
        email: profileData._json.email,
        fullName: profileData._json.name,
        id: profileData._json.sub,
        provider: "google",
      });
      expect(doneMock).toHaveBeenCalledExactlyOnceWith(null, userExists);
    });

    it.todo("should update their profile picture");
  });

  describe("given an already existing user", () => {
    it("should call the done function with the user object", async () => {
      expect.hasAssertions();

      const createUserGoogleMock = vi.spyOn(userQueries, "createUserGoogle");
      const doneMock = vi.fn<VerifyCallback>(() => {
        // empty
      });
      const existingUser = await prisma.user.create({
        data: {
          email: profileData._json.email,
          fullName: profileData._json.name,
          id: profileData._json.sub,
          provider: "google",
          password: null,
        },
      });

      await googleOauth2Verify(
        "accessToken",
        "refreshToken",
        profileData as Profile,
        doneMock,
      );

      expect(doneMock).toHaveBeenCalledExactlyOnceWith(null, existingUser);
      expect(createUserGoogleMock).not.toHaveBeenCalled();
    });
  });
});
