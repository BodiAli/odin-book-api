import express from "express";
import request from "supertest";
import unauthorizeGuest from "#src/middlewares/unauthorize-guest.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("unauthorize guest middleware", () => {
  it("should return a 403 status with error message when user is guest", async () => {
    expect.hasAssertions();

    const app = express();
    app.use(async (req, _res, next) => {
      const guestUser = await userQueries.getOrCreateGuestUser();
      req.user = guestUser;

      next();
    });
    app.get("/test", unauthorizeGuest, (_req, res) => {
      res.json("Passed");
    });

    const response = await request(app)
      .get("/test")
      .expect("Content-type", /json/)
      .expect(403);

    expect(response.body).toStrictEqual<ClientError>({
      errors: [
        { message: "You must register an account to complete this request." },
      ],
    });
  });

  it("should pass the request to next request handler when user is not a guest", async () => {
    expect.hasAssertions();

    const app = express();
    app.use(async (req, _res, next) => {
      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test: password",
      });
      req.user = user;

      next();
    });
    app.get("/test", unauthorizeGuest, (_req, res) => {
      res.json("Passed");
    });

    const response = await request(app)
      .get("/test")
      .expect("Content-type", /json/)
      .expect(200);

    expect(response.body).toBe("Passed");
  });
});
