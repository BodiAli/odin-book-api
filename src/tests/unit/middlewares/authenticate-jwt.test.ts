import { beforeAll, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import authenticateJwt from "#src/middlewares/authenticate-jwt.js";
import prisma from "#src/db/prisma-client.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { ClientError } from "#src/types/errors/errors.js";
import "#src/config/passport.js";

describe("validate JWT middleware", () => {
  const app = express();

  beforeAll(() => {
    app.get("/test", authenticateJwt, (_req, res) => {
      res.json("Passed");
    });
  });

  it("should return a 401 status with error message when user is unauthorized", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .get("/test")
      .expect("Content-type", /json/)
      .expect(401);

    expect(response.body).toStrictEqual<ClientError>({
      errors: [{ message: "Access token is missing or invalid." }],
    });
  });

  it("should pass the request to next request handler when user authorized", async () => {
    expect.hasAssertions();

    const currentUser = await prisma.user.create({
      data: {
        email: "test-email@test.com",
        fullName: "test: full name",
      },
    });
    const token = issueJwt(currentUser.id, "10m");

    const response = await request(app)
      .get("/test")
      .auth(token, { type: "bearer" })
      .expect("Content-type", /json/)
      .expect(200);

    expect(response.body).toBe("Passed");
  });
});
