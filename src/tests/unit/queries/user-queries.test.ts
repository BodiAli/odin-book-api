import { describe, expect, it } from "vitest";
import * as userQueries from "#src/queries/user-queries.js";
import prisma from "#src/lib/prisma-client.js";

describe("user-queries", () => {
  describe(userQueries.getUserWithPasswordByEmail, () => {
    it("should return null when no user is found", async () => {
      expect.hasAssertions();

      const user =
        await userQueries.getUserWithPasswordByEmail("non-existing-email");

      expect(user).toBeNull();
    });

    it("should return the user object with password", async () => {
      expect.hasAssertions();

      await prisma.user.create({
        data: {
          email: "test-email",
          password: "test-password",
          fullName: "test: full name",
          username: "test-username",
        },
      });
      const user = await userQueries.getUserWithPasswordByEmail("test-email");

      expect(user).toStrictEqual<{
        id: string;
        email: string;
        fullName: string;
        username: string;
        password: string;
      }>({
        email: "test-email",
        id: expect.any(String) as string,
        password: "test-password",
        fullName: "test: full name",
        username: "test-username",
      });
    });
  });
});
