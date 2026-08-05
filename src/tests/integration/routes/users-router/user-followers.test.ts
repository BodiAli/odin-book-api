import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { ClientError } from "#src/types/errors.js";

describe("user followers endpoints", () => {
  const app = express();
  app.use(indexRouter);

  describe("create follower for target user POST /users/:userId/followers", () => {
    describe("given non-existing target user", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const currentUser = await prisma.user.create({
          data: {
            email: "test-email@test.com",
            fullName: "test: full name",
          },
        });
        const token = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post("/users/nonExistingId/followers")
          .auth(token, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        expect(response.body).toStrictEqual<ClientError>({
          errors: [
            {
              message: "User not found.",
            },
          ],
        });
      });
    });

    describe("given valid target user id", () => {
      it.todo("should follow target user");
    });
  });
});
