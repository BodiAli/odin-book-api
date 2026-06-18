import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import prisma from "#src/lib/prisma-client.js";
import indexRouter from "#src/routes/index-router.js";
import type { SignUpRequestBody } from "#src/schemas/auth/sign-up.js";
import type { ClientError } from "#src/schemas/errors/error-schemas.js";
import type { AuthenticatedResponse } from "#src/schemas/auth/authenticated-response.js";

describe("signing up endpoints", () => {
  const app = express();
  app.use(indexRouter);

  describe("create user POST /auth/sign-up", () => {
    describe("given invalid inputs", () => {
      it("should return 400 status with error messages", async () => {
        expect.hasAssertions();

        const requestBody: Partial<SignUpRequestBody> = {
          email: "test-invalid-email",
          password: "test: valid password",
          confirmPassword: "test: invalid confirm password",
          fullName: "test: valid full name",
        };

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(400);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [
            {
              message: "Please provide a valid Email.",
            },
            {
              message: "Passwords do not match.",
            },
          ],
        });
      });
    });

    describe("given already existing email", () => {
      it("should return 409 status with error message", async () => {
        expect.hasAssertions();

        const requestBody: SignUpRequestBody = {
          email: "test-email@test.com",
          fullName: "test: full name",
          password: "test: password",
          confirmPassword: "test: password",
        };
        await prisma.user.create({
          data: {
            email: "test-email@test.com",
            fullName: "test: full name",
            password: "test: password",
          },
        });

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(409);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [
            {
              message: "Email already exists.",
            },
          ],
        });
      });
    });

    describe("given valid data", () => {
      it("should return 200 status with JWT and user object", async () => {
        expect.hasAssertions();

        const requestBody: SignUpRequestBody = {
          email: "test-email@test.com",
          fullName: "test: full name",
          password: "test: password",
          confirmPassword: "test: password",
        };

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(200);

        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            email: "test-email@test.com",
            fullName: "test: full name",
            id: expect.any(String) as string,
            provider: "local",
          },
        });
      });
    });
  });
});
