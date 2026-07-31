import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import * as userQueries from "#src/queries/user-queries.js";
import type {
  LogInRequestBody,
  AuthenticatedResponse,
} from "#src/types/auth.js";
import type { ClientError } from "#src/types/errors.js";

describe("logging in endpoints", () => {
  const app = express();
  app.use(indexRouter);

  describe("authenticate user POST /auth/log-in", () => {
    describe("given invalid data", () => {
      it("should return 400 status with error messages", async () => {
        expect.hasAssertions();

        const requestBody: LogInRequestBody = {
          email: "test-invalid-email",
          password: "",
        };

        const response = await request(app)
          .post("/auth/log-in")
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
              message: "Password cannot be empty.",
            },
          ],
        });
      });
    });

    describe("given invalid credentials with correct format", () => {
      it("should return 401 status with error message", async () => {
        expect.hasAssertions();

        const requestBody: LogInRequestBody = {
          password: "test: password",
          email: "test-email@test.com",
        };

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(401);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [{ message: "Incorrect email or password." }],
        });
      });
    });

    describe("given valid data and correct credentials", () => {
      it("should return 200 status with token and user object", async () => {
        expect.hasAssertions();

        const requestBody: LogInRequestBody = {
          email: "test-email@test.com",
          password: "test: password",
        };
        const user = await userQueries.createUserLocal({
          email: "test-email@test.com",
          fullName: "test: full name",
          password: "test: password",
        });

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(200);

        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            email: "test-email@test.com",
            fullName: "test: full name",
            id: user.id,
            provider: "local",
            picture: null,
            isOnline: true,
          },
        });
      });
    });

    describe("given user doesn't have a password", () => {
      it("should return an error", async () => {
        expect.hasAssertions();

        await prisma.user.create({
          data: {
            email: "test-email@test.com",
            fullName: "test: full name",
            provider: "google",
            password: null,
          },
        });
        const requestBody: LogInRequestBody = {
          email: "test-email@test.com",
          password: "test: password",
        };

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(401);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [{ message: "Incorrect email or password." }],
        });
      });
    });
  });
});
