import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { User } from "#src/types/routes/users.js";

describe("user queries", () => {
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
        provider: "LOCAL",
        picture: null,
        isOnline: false,
        isGuest: false,
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
        provider: "LOCAL",
        picture: null,
        isOnline: false,
        isGuest: false,
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
      const didPasswordMatch = await bcrypt.compare(
        "test: password",
        userWithPassword.password,
      );

      expect(userWithPassword.password).not.toBe("test: password");
      expect(didPasswordMatch).toBe(true);
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
        provider: "LOCAL",
        picture: null,
        isOnline: true,
        isGuest: false,
      });
    });

    it("should call createProfile", async () => {
      expect.hasAssertions();

      const mockCreateProfile = vi.spyOn(profileQueries, "createProfile");
      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
      });

      expect(mockCreateProfile).toHaveBeenCalledExactlyOnceWith({
        userId: user.id,
        imageUrl: null,
        description: null,
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
        provider: "LOCAL",
        id: createdUser.id,
        picture: null,
        isOnline: false,
        isGuest: false,
      });
    });
  });

  describe(userQueries.createUserOauth, () => {
    it("should create user with 'google' as the provider field when 'google' value is passed", async () => {
      expect.hasAssertions();

      await userQueries.createUserOauth({
        email: "test-email@test.com",
        fullName: "test: full name",
        provider: "GOOGLE",
      });
      const createdUser = await userQueries.getUserWithPasswordByEmail(
        "test-email@test.com",
      );

      expect(createdUser).toStrictEqual<User & { password: string | null }>({
        id: expect.any(String) as string,
        email: "test-email@test.com",
        fullName: "test: full name",
        provider: "GOOGLE",
        password: null,
        picture: null,
        isOnline: true,
        isGuest: false,
      });
    });

    it("should create user with 'github' as the provider field when 'github' value is passed", async () => {
      expect.hasAssertions();

      await userQueries.createUserOauth({
        email: "test-email@test.com",
        fullName: "test: full name",
        provider: "GITHUB",
      });
      const createdUser = await userQueries.getUserWithPasswordByEmail(
        "test-email@test.com",
      );

      expect(createdUser).toStrictEqual<User & { password: string | null }>({
        id: expect.any(String) as string,
        email: "test-email@test.com",
        fullName: "test: full name",
        provider: "GITHUB",
        password: null,
        picture: null,
        isOnline: true,
        isGuest: false,
      });
    });
  });

  describe(userQueries.getOrCreateGuestUser, () => {
    it("should create new guest user when no guest user exists", async () => {
      expect.hasAssertions();

      const nonExistingUser = await prisma.user.findUnique({
        where: {
          email: "guest-user",
        },
      });

      await userQueries.getOrCreateGuestUser();
      const guestUser = await prisma.user.findUnique({
        where: {
          email: "guest-user",
        },
      });

      expect(nonExistingUser).toBeNull();
      expect(guestUser).not.toBeNull();
    });

    it("should get the guest user when guest user already exists", async () => {
      expect.hasAssertions();

      await userQueries.getOrCreateGuestUser();
      const guestExists = await prisma.user.findUnique({
        where: {
          email: "guest-user",
        },
      });
      assert(guestExists);

      const guestUser = await userQueries.getOrCreateGuestUser();

      expect(guestUser.id).toBe(guestExists.id);
    });
  });
});
