import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import indexRouter from "#src/routes/index-router.js";
import type { ClientError } from "#src/types/errors.js";

describe("user followers endpoints", () => {
  const app = express();
  app.use(indexRouter);

  describe("create follower for target user POST /users/:userId/followers", () => {
    describe("given non-existing target user", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const response = await request(app).post(
          "/users/nonExistingId/followers",
        );

        expect(response.body).toStrictEqual<ClientError>({
          errors: [
            {
              message: "User not found.",
            },
          ],
        });
      });
    });
  });
});
