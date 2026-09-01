import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import type { AuthenticatedResponse } from "#src/types/routes/auth.js";

describe("/auth/guest endpoint", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  describe("signing in as guest POST", () => {
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
          provider: "LOCAL",
          isGuest: true,
        },
      });
    });
  });
});
