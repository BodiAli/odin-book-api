import { describe, expect, it } from "vitest";
import * as profileQueries from "#src/queries/profile-queries.js";
import prisma from "#src/lib/prisma-client.js";
import type { ProfileModel } from "#src/generated/prisma/models.js";

describe("profile-queries", () => {
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
});
