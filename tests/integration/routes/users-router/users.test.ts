import request from "supertest";
import express from "express";
import prisma from "#src/db/prisma-client.js";
import indexRouter from "#src/routes/index-router.js";
import type { AuthenticatedResponse } from "#src/types/routes/tokens.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { CreateUserRequestBody } from "#src/types/routes/users.js";

describe("/users path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  describe("create user POST", () => {
    it("should return 400 status with error messages when given invalid inputs", async () => {
      expect.hasAssertions();

      const requestBody: Partial<CreateUserRequestBody> = {
        email: "test-invalid-email",
        password: "test: valid password",
        confirmPassword: "test: invalid confirm password",
        fullName: "test: valid full name",
      };

      const response = await request(app)
        .post("/users")
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

    it("should return 409 status with error message when email already exists", async () => {
      expect.hasAssertions();

      const requestBody: CreateUserRequestBody = {
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
        .post("/users")
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

    it("should return 201 status with JWT when given valid data", async () => {
      expect.hasAssertions();

      const requestBody: CreateUserRequestBody = {
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
        confirmPassword: "test: password",
      };

      const response = await request(app)
        .post("/users")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(201);

      expect(response.body).toStrictEqual<AuthenticatedResponse>({
        token: expect.any(String) as string,
      });
    });

    it("should set the location header", async () => {
      expect.hasAssertions();

      const requestBody: CreateUserRequestBody = {
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
        confirmPassword: "test: password",
      };

      const response = await request(app)
        .post("/users")
        .type("json")
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(201);

      expect(response.headers["location"]).toBe("/users/me");
    });
  });
});
