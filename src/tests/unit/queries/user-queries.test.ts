import { describe, expect, it, assert } from "vitest";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";
import prisma from "#src/lib/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { User } from "#src/schemas/users/user-schema.js";

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
        },
      });
      type UserWithPassword = User & { password: string };

      const user = await userQueries.getUserWithPasswordByEmail(
        "test-email@test.com",
      );

      expect(user).toStrictEqual<UserWithPassword>({
        id: expect.any(String) as string,
        email: "test-email@test.com",
        password: "test-password",
        fullName: "test: full name",
        provider: "local",
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

    it("should throw error when creating user with already existing email", async () => {
      expect.hasAssertions();

      const { email, fullName, password }: userQueries.CreateUserArguments = {
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
      };

      await prisma.user.create({
        data: {
          email,
          fullName,
          password,
        },
      });

      await expect(
        userQueries.createUser({
          email,
          fullName,
          password,
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
      });

      expect(user).toStrictEqual<User>({
        email: "test-email@test.com",
        fullName: "test: full name",
        id: user.id,
        provider: "local",
      });
    });
  });

  describe(userQueries.getUserById, () => {
    it("should return user", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          password: "test: password",
        },
      });

      const user = await userQueries.getUserById(createdUser.id);

      expect(user).toStrictEqual<User>({
        email: "test-email@test.com",
        fullName: "test: full name",
        provider: "local",
        id: createdUser.id,
      });
    });
  });
});
