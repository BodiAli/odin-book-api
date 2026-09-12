import prisma from "#src/db/prisma-client.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import type { ProfileModel } from "#src/generated/prisma/models.js";

describe("profile queries", () => {
  describe(profileQueries.createProfile, () => {
    it("should create a new profile", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });

      const profile = await profileQueries.createProfile({
        userId: createdUser.id,
        imageUrl: "test-image-url",
        description: "test: profile description",
      });

      expect(profile).toStrictEqual<ProfileModel>({
        id: profile.id,
        description: "test: profile description",
        imageUrl: "test-image-url",
        userId: createdUser.id,
      });
    });
  });

  describe(profileQueries.createOrUpdateProfilePicture, () => {
    it("should create a new profile with a profile picture if no profile is found", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          id: "test-userId",
          password: null,
          provider: "GOOGLE",
        },
      });
      await profileQueries.createOrUpdateProfilePicture(
        createdUser.id,
        "test-image-url",
      );

      const createdProfile = await prisma.profile.findUnique({
        where: {
          userId: createdUser.id,
        },
      });
      assert(createdProfile);

      expect(createdProfile.imageUrl).toBe("test-image-url");
    });

    it("should update user profile with the provided imageUrl when user profile exists", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          id: "test-userId",
          password: null,
          provider: "GOOGLE",
          profile: {
            create: {
              imageUrl: "test-image-url-1",
            },
          },
        },
      });
      const notUpdatedProfile = await prisma.profile.findUnique({
        where: {
          userId: createdUser.id,
        },
      });
      assert(notUpdatedProfile);
      const profilePicture = await profileQueries.createOrUpdateProfilePicture(
        createdUser.id,
        "test-image-url",
      );
      const updatedProfile = await prisma.profile.findUnique({
        where: {
          userId: createdUser.id,
        },
      });
      assert(updatedProfile);

      expect(notUpdatedProfile.imageUrl).toBe("test-image-url-1");
      expect(updatedProfile.imageUrl).toBe("test-image-url");
      expect(profilePicture).toBe(updatedProfile.imageUrl);
    });
  });

  describe(profileQueries.getProfilePicture, () => {
    it("should return null when user doesn't have a profile picture", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: fullname",
          password: "test: password",
        },
      });
      await profileQueries.createProfile({
        userId: user.id,
        description: "test: profile description",
        imageUrl: null,
      });

      const profilePicture = await profileQueries.getProfilePicture(user.id);

      expect(profilePicture).toBeNull();
    });

    it("should return user's profile picture when user has a profile picture", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: fullname",
          password: "test: password",
        },
      });
      await profileQueries.createProfile({
        userId: user.id,
        description: "test: profile description",
        imageUrl: "test-image-url",
      });

      const profilePicture = await profileQueries.getProfilePicture(user.id);

      expect(profilePicture).toBe("test-image-url");
    });
  });
});
