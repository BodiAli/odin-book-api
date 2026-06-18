import { describe, expect, it, assert } from "vitest";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";
import prisma from "#src/lib/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { UserModel } from "#src/generated/prisma/models.js";

describe("user-queries", () => {
  describe(userQueries.getUserWithPasswordByEmail, () => {
    it("should return null when no user is found", async () => {
      expect.hasAssertions();

      const user = await userQueries.getUserWithPasswordByEmail(
        "non-existing-email@test.com",
      );

      expect(user).toBeNull();
    });

    it("should return the user object with password", async () => {
      expect.hasAssertions();

      await prisma.user.create({
        data: {
          email: "test-email@test.com",
          password: "test-password",
          fullName: "test: full name",
          username: "test-username",
        },
      });
      const user = await userQueries.getUserWithPasswordByEmail(
        "test-email@test.com",
      );

      expect(user).toStrictEqual<{
        id: string;
        email: string;
        fullName: string;
        username: string;
        password: string;
      }>({
        id: expect.any(String) as string,
        email: "test-email@test.com",
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
        email: "test-email@test.com",
        password: "test: password",
        username: "test-username",
      });

      const userWithPassword = await userQueries.getUserWithPasswordByEmail(
        user.email,
      );
      assert(userWithPassword);
      assert(userWithPassword.password);
      const doesPasswordMatch = await bcrypt.compare(
        "test: password",
        userWithPassword.password,
      );

      expect(userWithPassword.password).not.toBe("test: password");
      expect(doesPasswordMatch).toBe(true);
    });

    it("should throw error when creating user with already existing username", async () => {
      expect.hasAssertions();

      const { email, username, fullName, password }: Omit<UserModel, "id"> = {
        email: "test-email1@test.com",
        fullName: "test: full name",
        password: "test: password",
        username: "test-username-exists",
      };

      await prisma.user.create({
        data: {
          email: "test-email2@test.com",
          fullName,
          password,
          username,
        },
      });

      await expect(
        userQueries.createUser({
          email,
          fullName,
          password,
          username,
        }),
      ).rejects.toStrictEqual(
        new CustomHttpStatusError(409, "Username already exists."),
      );
    });

    it("should throw error when creating user with already existing email", async () => {
      expect.hasAssertions();

      const { email, username, fullName, password }: Omit<UserModel, "id"> = {
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
        username: "test-username1",
      };

      await prisma.user.create({
        data: {
          email,
          fullName,
          password,
          username: "test-username2",
        },
      });

      await expect(
        userQueries.createUser({
          email,
          fullName,
          password,
          username,
        }),
      ).rejects.toStrictEqual(
        new CustomHttpStatusError(409, "Email already exists."),
      );
    });

    it("should return new user record", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUser({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
        username: "test-username",
      });

      expect(user).toStrictEqual<Omit<UserModel, "password">>({
        email: "test-email@test.com",
        fullName: "test: full name",
        id: user.id,
        username: "test-username",
      });
    });
  });
});
