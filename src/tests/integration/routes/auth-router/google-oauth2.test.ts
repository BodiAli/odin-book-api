import { describe, it, expect, vi, afterEach, assert, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import type {
  Oauth2RequestBody,
  AuthenticatedResponse,
  Oauth2UserData,
} from "#src/types/routes/auth.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("/auth/google endpoint", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("authenticate with google POST", () => {
    it("should return 400 status with error message when given missing inputs", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/auth/google")
        .type("json")
        .send({})
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "Invalid input.",
          },
        ],
      });
    });

    it("should return 401 status with error message when user denies the authorization", async () => {
      expect.hasAssertions();

      const requestBody: Oauth2RequestBody = {
        success: false,
        error: "access_denied",
      };

      const response = await request(app)
        .post("/auth/google")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(401);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "Access denied",
          },
        ],
      });
    });

    it("should return 502 status when request fails due to unknown reason", async () => {
      expect.hasAssertions();

      const requestBody: Oauth2RequestBody = {
        success: true,
        code: "test-authorization-code",
        codeVerifier: "test-code-verifier",
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_scope" }), {
          status: 400,
          statusText: "Bad request",
        }),
      );

      const response = await request(app)
        .post("/auth/google")
        .type("json")
        .send(requestBody);

      expect(response.statusCode).toBe(502);
    });

    it("should return 400 status with error message when request has invalid authorization code", async () => {
      expect.hasAssertions();

      const requestBody: Oauth2RequestBody = {
        success: true,
        code: "test-invalid-authorization-code",
        codeVerifier: "test-code-verifier",
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description: "Bad request",
          }),
          {
            status: 400,
          },
        ),
      );

      const response = await request(app)
        .post("/auth/google")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "Bad request",
          },
        ],
      });
    });

    it("should create user and return JWT with user object when user does not exist", async () => {
      expect.hasAssertions();

      const googleUserData: Oauth2UserData = {
        email: "test-email@test.com",
        name: "test: full name",
        picture: "test-image-url",
      };
      const nonExistingUser = await prisma.user.findUnique({
        where: {
          email: googleUserData.email,
        },
      });
      const idToken = jwt.sign(googleUserData, "secret-key");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ id_token: idToken }), {
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
      const requestBody: Oauth2RequestBody = {
        code: "test-authorization-code",
        codeVerifier: "test-code-verifier",
        success: true,
      };

      const response = await request(app)
        .post("/auth/google")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(200);
      const existingUser = await prisma.user.findUnique({
        where: {
          email: googleUserData.email,
        },
      });
      assert(existingUser);

      expect(nonExistingUser).toBeNull();
      expect(existingUser).not.toBeNull();
      expect(response.body).toStrictEqual<AuthenticatedResponse>({
        token: expect.any(String) as string,
        user: {
          id: existingUser.id,
          email: googleUserData.email,
          fullName: googleUserData.name,
          picture: googleUserData.picture,
          provider: "GOOGLE",
          isOnline: true,
          isGuest: false,
        },
      });
    });

    it("should return user object and JWT with updated picture when user is signed up using email and password", async () => {
      expect.hasAssertions();

      const createdUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          id: "test-userId",
          password: "test: password",
          provider: "LOCAL",
          isOnline: true,
          profile: {
            create: {
              imageUrl: "test-image-url-1",
            },
          },
        },
        include: {
          profile: {
            select: {
              imageUrl: true,
            },
          },
        },
      });
      const googleUserData: Oauth2UserData = {
        email: "test-email@test.com",
        name: "test: full name",
        picture: "test-image-url-2",
      };
      const idToken = jwt.sign(googleUserData, "secret-key");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            id_token: idToken,
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );
      const requestBody: Oauth2RequestBody = {
        code: "test-authorization-code",
        codeVerifier: "test-code-verifier",
        success: true,
      };

      const response = await request(app)
        .post("/auth/google")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<AuthenticatedResponse>({
        token: expect.any(String) as string,
        user: {
          email: createdUser.email,
          fullName: createdUser.fullName,
          id: createdUser.id,
          picture: googleUserData.picture,
          provider: "LOCAL",
          isOnline: createdUser.isOnline,
          isGuest: false,
        },
      });
    });
  });
});
