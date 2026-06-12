import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import authRouter from "#src/routes/auth-router.js";
import prisma from "#src/lib/prisma-client.js";
import type {
  SignUpRequestBody,
  SignUpResponseBody,
} from "#src/schemas/auth/sign-up.js";
import type { ClientError } from "#src/schemas/errors/error-schemas.js";
import type { LogInRequestBody } from "#src/schemas/auth/log-in.js";
import "#src/config/passport.js";

describe("auth-router endpoints", () => {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);

  describe("create user POST /auth/sign-up", () => {
    describe("given invalid inputs", () => {
      it("should return 400 status with error messages", async () => {
        expect.hasAssertions();

        const requestBody: Partial<SignUpRequestBody> = {
          username: "test: invalid username",
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
              message: "Username cannot include space.",
            },
            {
              message: "Passwords do not match.",
            },
          ],
        });
      });
    });

    describe("given already existing username", () => {
      it("should return 409 status with error message", async () => {
        expect.hasAssertions();

        const requestBody: SignUpRequestBody = {
          username: "test-username",
          fullName: "test: full name",
          password: "test: password",
          confirmPassword: "test: password",
        };
        await prisma.user.create({
          data: {
            username: "test-username",
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
              message: "Username already exists.",
            },
          ],
        });
      });
    });

    describe("given valid data", () => {
      it("should return 200 status with JWT and user object", async () => {
        expect.hasAssertions();

        const requestBody: SignUpRequestBody = {
          username: "test-username",
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

        expect(response.body).toStrictEqual<SignUpResponseBody>({
          token: expect.any(String) as string,
          user: {
            fullName: "test: full name",
            id: expect.any(String) as string,
            username: "test-username",
          },
        });
      });
    });
  });

  describe("authenticate user POST /auth/log-in", () => {
    describe("given invalid data", () => {
      it("should return 400 status with error messages", async () => {
        expect.hasAssertions();

        const requestBody: LogInRequestBody = {
          username: "test: invalid username",
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
              message: "Username cannot include space.",
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
          username: "test-username",
        };

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send(requestBody)
          .expect("Content-type", /json/)
          .expect(401);

        console.log(response.text);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [{ message: "Incorrect username or password." }],
        });
      });
    });

    describe("given valid data and correct credentials", () => {
      it.todo("should return 200 status with token and user object");
    });
  });
});
