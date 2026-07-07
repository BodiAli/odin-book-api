import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/lib/prisma-client.js";
import type {
  Oauth2RequestBody,
  AuthenticatedResponse,
} from "#src/types/auth.js";
import type { ClientError } from "#src/types/errors.js";

describe("google oauth2 endpoints", () => {
  const app = express();
  app.use(indexRouter);

  describe("authenticate with google POST /auth/google", () => {
    describe("given missing credentials", () => {
      it("should return 400 status with error messages", async () => {
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
              message: "Please provide an authorization code",
            },
            {
              message: "Please provide a code verifier",
            },
          ],
        });
      });
    });

    describe("given non existing user", () => {
      it("should return create user and return JWT with user object", async () => {
        expect.hasAssertions();

        const userGoogle = {
          sub: "test-userId",
          email: "test-email@test.com",
          name: "test: full name",
          picture: "test-image-url",
        };
        const nonExistingUser = await prisma.user.findUnique({
          where: {
            id: userGoogle.sub,
          },
        });
        const idToken = jwt.sign(userGoogle, "secret-key");
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
        };

        const response = await request(app)
          .post("/auth/google")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(200);
        const existingUser = await prisma.user.findUnique({
          where: {
            id: userGoogle.sub,
          },
        });

        expect(nonExistingUser).toBeNull();
        expect(existingUser).not.toBeNull();
        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            email: userGoogle.email,
            fullName: userGoogle.name,
            id: userGoogle.sub,
            picture: userGoogle.picture,
            provider: "google",
          },
        });
      });
    });

    describe("given existing user", () => {
      it.todo("test");
    });
  });
});
