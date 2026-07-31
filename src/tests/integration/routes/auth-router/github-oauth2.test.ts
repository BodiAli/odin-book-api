import { afterEach, assert, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import type { ClientError } from "#src/types/errors.js";
import type {
  AuthenticatedResponse,
  Oauth2RequestBody,
} from "#src/types/auth.js";

describe("github oauth2 endpoint", () => {
  const app = express();
  app.use(indexRouter);

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("authenticate with Github POST /auth/github", () => {
    const requestBody: Oauth2RequestBody = {
      success: true,
      code: "test-authorization-code",
      codeVerifier: "test-codeVerifier",
    };

    describe("given missing or invalid credentials", () => {
      it("should return 400 status with error messages", async () => {
        expect.hasAssertions();

        const invalidRequestBody = {
          code: "test-authorization-code",
          codeVerifier: "test-code-verifier",
        };

        const response = await request(app)
          .post("/auth/github")
          .type("json")
          .send(invalidRequestBody)
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

    describe("given thrown CustomHttpStatusError", () => {
      it("should handle the error by returning the error code and message", async () => {
        expect.hasAssertions();

        vi.spyOn(globalThis, "fetch").mockResolvedValue(
          new Response(JSON.stringify({ error: "unexpected_error" }), {
            status: 500,
          }),
        );

        const response = await request(app)
          .post("/auth/github")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(502);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [{ message: "Failed to authenticate with Github." }],
        });
      });
    });

    describe("given valid request", () => {
      it("should return 200 status with token and user object", async () => {
        expect.hasAssertions();

        vi.spyOn(globalThis, "fetch")
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ access_token: "access-token" }), {
              status: 200,
            }),
          )
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                id: 123,
                name: "test: github name",
                avatar_url: "test-image-url",
              }),
              { status: 200 },
            ),
          )
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify([
                {
                  email: "test-not-primary-email@test.com",
                  verified: true,
                  primary: false,
                },
                {
                  email: "test-primary-email@test.com",
                  verified: true,
                  primary: true,
                },
              ]),
            ),
          );
        const nonExistingUser = await prisma.user.findUnique({
          where: {
            email: "test-primary-email@test.com",
          },
        });

        const response = await request(app)
          .post("/auth/github")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(200);
        const existingUser = await prisma.user.findUnique({
          where: {
            email: "test-primary-email@test.com",
          },
        });
        assert(existingUser);

        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            id: existingUser.id,
            email: "test-primary-email@test.com",
            fullName: "test: github name",
            isOnline: true,
            picture: "test-image-url",
            provider: "github",
          },
        });
        expect(nonExistingUser).toBeNull();
        expect(existingUser).not.toBeNull();
      });
    });
  });
});
