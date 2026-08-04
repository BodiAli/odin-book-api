import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import type { AuthenticatedResponse } from "#src/types/auth.js";

describe("guest sign in endpoint", () => {
  const app = express();
  app.use(indexRouter);

  describe("signing in as guest POST /auth/guest", () => {
    describe("given request to endpoint", () => {
      it("should return jwt token with guest user", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/guest")
          .expect("Content-type", /json/)
          .expect(200);

        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            id: expect.any(String) as string,
            email: "guest-user",
            fullName: "Guest",
            isOnline: true,
            picture: null,
            provider: "local",
            isGuest: true,
          },
        });
      });
    });
  });
});
