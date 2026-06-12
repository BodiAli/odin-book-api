import { describe, expect, it, assert } from "vitest";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";
import prisma from "#src/lib/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { UserModel } from "#src/generated/prisma/models.js";

describe("user-queries", () => {
  describe(userQueries.getUserWithPasswordByUsername, () => {
    it("should return null when no user is found", async () => {
      expect.hasAssertions();

      const user = await userQueries.getUserWithPasswordByUsername(
        "non-existing-username",
      );

      expect(user).toBeNull();
    });

    it("should return the user object with password", async () => {
      expect.hasAssertions();

      await prisma.user.create({
        data: {
          password: "test-password",
          fullName: "test: full name",
          username: "test-username",
        },
      });
      const user =
        await userQueries.getUserWithPasswordByUsername("test-username");

      expect(user).toStrictEqual<{
        id: string;
        fullName: string;
        username: string;
        password: string;
      }>({
        id: expect.any(String) as string,
        password: "test-password",
        fullName: "test: full name",
        username: "test-username",
      });
    });
  });

  describe(userQueries.createUser, () => {
    it("should hash the password before storing it", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUser({
        fullName: "test: full name",
        password: "test: password",
        username: "test-username",
      });

      const userWithPassword = await userQueries.getUserWithPasswordByUsername(
        user.username,
      );
      assert(userWithPassword);
      const doesPasswordMatch = await bcrypt.compare(
        "test: password",
        userWithPassword.password,
      );

      expect(userWithPassword.password).not.toBe("test: password");
      expect(doesPasswordMatch).toBe(true);
    });

    it("should throw error when creating user with already existing username", async () => {
      expect.hasAssertions();

      const { username, fullName, password }: Omit<UserModel, "id"> = {
        fullName: "test: full name",
        password: "test: password",
        username: "test-username-exists",
      };

      await prisma.user.create({
        data: {
          fullName,
          password,
          username,
        },
      });

      await expect(
        userQueries.createUser({
          fullName,
          password,
          username,
        }),
      ).rejects.toStrictEqual(
        new CustomHttpStatusError(409, "Username already exists."),
      );
    });

    it("should return new user record", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUser({
        fullName: "test: full name",
        password: "test: password",
        username: "test-username",
      });

      expect(user).toStrictEqual<Omit<UserModel, "password">>({
        fullName: "test: full name",
        id: user.id,
        username: "test-username",
      });
    });
  });
});
