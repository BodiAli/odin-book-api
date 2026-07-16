import { describe, expect, it, assert } from "vitest";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";
import prisma from "#src/lib/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { User } from "#src/types/current-user.js";

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
        picture: null,
        isOnline: false,
      });
    });
  });

  describe(userQueries.getUserByEmail, () => {
    it("should return null when no user is found", async () => {
      expect.hasAssertions();

      const user = await userQueries.getUserByEmail(
        "non-existing-email@test.com",
      );

      expect(user).toBeNull();
    });

    it("should return the user object without password", async () => {
      expect.hasAssertions();

      await prisma.user.create({
        data: {
          email: "test-email@test.com",
          password: "test-password",
          fullName: "test: full name",
        },
      });

      const user = await userQueries.getUserByEmail("test-email@test.com");

      expect(user).toStrictEqual<User>({
        id: expect.any(String) as string,
        email: "test-email@test.com",
        fullName: "test: full name",
        provider: "local",
        picture: null,
        isOnline: false,
      });
    });
  });

  describe(userQueries.createUserLocal, () => {
    it("should hash the password before storing it", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
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

      const {
        email,
        fullName,
        password,
      }: userQueries.CreateUserLocalArguments = {
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
        userQueries.createUserLocal({
          email,
          fullName,
          password,
        }),
      ).rejects.toStrictEqual(
        new CustomHttpStatusError(409, "Email already exists."),
      );
    });

    it("should create new user record with 'local' provider field", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
      });

      expect(user).toStrictEqual<User>({
        email: "test-email@test.com",
        fullName: "test: full name",
        id: user.id,
        provider: "local",
        picture: null,
        isOnline: true,
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
        picture: null,
        isOnline: false,
      });
    });
  });

  describe(userQueries.createUserGoogle, () => {
    it("should create user field with 'google' as the provider field", async () => {
      expect.hasAssertions();

      await userQueries.createUserGoogle({
        email: "test-email@test.com",
        fullName: "test: full name",
        id: "test-userId",
      });
      const createdUser = await userQueries.getUserWithPasswordByEmail(
        "test-email@test.com",
      );

      expect(createdUser).toStrictEqual<User & { password: string | null }>({
        email: "test-email@test.com",
        fullName: "test: full name",
        id: "test-userId",
        provider: "google",
        password: null,
        picture: null,
        isOnline: true,
      });
    });
  });
});
