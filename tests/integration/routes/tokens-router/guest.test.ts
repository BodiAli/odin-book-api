import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import type { AuthenticatedResponse } from "#src/types/routes/tokens.js";

describe("/tokens/guest path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  describe("signing in as guest POST", () => {
    it("should return jwt token", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/tokens/guest")
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<AuthenticatedResponse>({
        token: expect.any(String) as string,
      });
    });
  });
});
