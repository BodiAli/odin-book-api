import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import authRouter from "#src/routes/auth-router.js";
import type {
  SignUpRequestBody,
  SignUpResponseBody,
} from "#src/schemas/sign-up.js";
import type { ClientError } from "#src/schemas/error-schemas.js";

describe("auth-router endpoints", () => {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);

  describe("create user POST /auth/sign-up", () => {
    describe("given invalid inputs", () => {
      it("should return 400 status with error messages", async () => {
        expect.hasAssertions();

        const requestBody: Partial<SignUpRequestBody> = {
          email: "test-invalid-email",
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
              message: "Please provide a valid Email.",
            },
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

    describe("given already existing email", () => {
      it("should return 409 status with error message", async () => {
        expect.hasAssertions();

        const requestBody: SignUpRequestBody = {
          email: "test-email-exists@test.com",
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
  });
});
