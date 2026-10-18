import request from "supertest";
import express from "express";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import * as userQueries from "#src/queries/user-queries.js";
import type {
  LogInRequestBody,
  AuthenticatedResponse,
} from "#src/types/routes/tokens.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("/tokens/local path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  describe("authenticate user POST", () => {
    it("should return 400 status with error messages when given invalid data", async () => {
      expect.hasAssertions();

      const requestBody: LogInRequestBody = {
        email: "test-invalid-email",
        password: "",
      };

      const response = await request(app)
        .post("/tokens/local")
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

    it("should return 401 status with error message when given invalid credentials with correct format", async () => {
      expect.hasAssertions();

      const requestBody: LogInRequestBody = {
        password: "test: password",
        email: "test-email@test.com",
      };

      const response = await request(app)
        .post("/tokens/local")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(401);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Incorrect email or password." }],
      });
    });

    it("should return 200 status with token when given valid data and correct credentials", async () => {
      expect.hasAssertions();

      const requestBody: LogInRequestBody = {
        email: "test-email@test.com",
        password: "test: password",
      };
      await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
      });

      const response = await request(app)
        .post("/tokens/local")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<AuthenticatedResponse>({
        token: expect.any(String) as string,
      });
    });

    it("should return an error when user doesn't have a password", async () => {
      expect.hasAssertions();

      await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
          provider: "GOOGLE",
          password: null,
        },
      });
      const requestBody: LogInRequestBody = {
        email: "test-email@test.com",
        password: "test: password",
      };

      const response = await request(app)
        .post("/tokens/local")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(401);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Incorrect email or password." }],
      });
    });

    it("should return WWW-Authenticate header with LoginForm authentication scheme", async () => {
      expect.hasAssertions();

      const requestBody: LogInRequestBody = {
        password: "test: password",
        email: "test-email@test.com",
      };

      const response = await request(app)
        .post("/tokens/local")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(401);

      expect(response.headers["www-authenticate"]).toBe("LoginForm");
    });
  });
});
