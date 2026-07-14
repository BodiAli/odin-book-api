import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/lib/prisma-client.js";
import type {
  Oauth2RequestBody,
  AuthenticatedResponse,
  Oauth2UserData,
} from "#src/types/auth.js";
import type { ClientError } from "#src/types/errors.js";

describe("google oauth2 endpoints", () => {
  const app = express();
  app.use(indexRouter);

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("authenticate with google POST /auth/google", () => {
    describe("given missing inputs", () => {
      it("should return 400 status with error message", async () => {
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
    });

    describe("given user denied the authorization", () => {
      it("should return 401 status with error message", async () => {
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
    });

    describe("given request failed due to unknown reason", () => {
      it("should return 500 status", async () => {
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

        expect(response.serverError).toBe(true);
      });
    });

    describe("given invalid authorization code", () => {
      it("should return 400 status with error message", async () => {
        expect.hasAssertions();

        const requestBody: Oauth2RequestBody = {
          success: true,
          code: "test-invalid-authorization-code",
          codeVerifier: "test-code-verifier",
        };
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
          new Response(JSON.stringify({ error: "invalid_grant" }), {
            status: 400,
            statusText: "Bad request",
          }),
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
              message: "Invalid or expired authorization code.",
            },
          ],
        });
      });
    });

    describe("given non existing user", () => {
      it("should create user and return JWT with user object", async () => {
        expect.hasAssertions();

        const googleUserData: Oauth2UserData = {
          sub: "test-userId",
          email: "test-email@test.com",
          name: "test: full name",
          picture: "test-image-url",
        };
        const nonExistingUser = await prisma.user.findUnique({
          where: {
            id: googleUserData.sub,
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
            id: googleUserData.sub,
          },
        });

        expect(nonExistingUser).toBeNull();
        expect(existingUser).not.toBeNull();
        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            email: googleUserData.email,
            fullName: googleUserData.name,
            id: googleUserData.sub,
            picture: googleUserData.picture,
            provider: "google",
          },
        });
      });
    });

    describe("given signed up user using email and password", () => {
      it("should return user object and JWT with updated picture", async () => {
        expect.hasAssertions();

        const createdUser = await prisma.user.create({
          data: {
            email: "test-email@test.com",
            fullName: "test: full name",
            id: "test-userId-1",
            password: "test: password",
            provider: "local",
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
          sub: "test-userId-2",
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
            provider: "local",
          },
        });
      });
    });
  });
});
