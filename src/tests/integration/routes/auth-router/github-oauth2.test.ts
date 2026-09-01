import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type {
  AuthenticatedResponse,
  Oauth2RequestBody,
} from "#src/types/routes/auth.js";

describe("/auth/github endpoint", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("authenticate with Github POST", () => {
    const requestBody: Oauth2RequestBody = {
      success: true,
      code: "test-authorization-code",
      codeVerifier: "test-codeVerifier",
    };

    it("should return 400 status with error messages when given missing or invalid credentials", async () => {
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

    it("should handle the error by returning the error code and message when CustomHttpStatusError is thrown", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        Response.json(
          { error: "unexpected_error" },
          {
            status: 500,
          },
        ),
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

    it("should return 200 status with token and user object when request is valid", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          Response.json(
            { access_token: "access-token" },
            {
              status: 200,
            },
          ),
        )
        .mockResolvedValueOnce(
          Response.json(
            {
              id: 123,
              name: "test: github name",
              avatar_url: "test-image-url",
            },
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          Response.json([
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
          provider: "GITHUB",
          isGuest: false,
        },
      });
      expect(nonExistingUser).toBeNull();
      expect(existingUser).not.toBeNull();
    });
  });
});
