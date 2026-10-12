import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { GetCurrentUserResponse } from "#src/types/routes/users.js";

describe("/users/me path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  describe("get the current authenticated user GET", () => {
    it("should authenticate JWT", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get("/users/me")
        .expect("Content-type", /json/);

      expect(response.unauthorized).toBe(true);
    });

    it("should return current user", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-password",
      });
      const userToken = issueJwt(user.id);

      const response = await request(app)
        .get("/users/me")
        .auth(userToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<GetCurrentUserResponse>({
        user: {
          id: user.id,
          email: "test-email@test.com",
          fullName: "test: full name",
          isOnline: true,
          isGuest: false,
          picture: null,
          provider: "LOCAL",
        },
      });
    });
  });
});
