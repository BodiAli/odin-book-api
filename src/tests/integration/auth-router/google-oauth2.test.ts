import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import passport from "passport";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedResponse } from "#src/schemas/auth/authenticated-response.js";

describe("google oauth2 endpoints", () => {
  afterEach(() => {
    vi.resetModules();
  });

  describe("redirect to google consent screen GET /auth/google", () => {
    describe("given a valid request", () => {
      it("should return 302 status with a location header that links to google oauth2 authorization endpoint", async () => {
        expect.hasAssertions();

        const { default: indexRouter } =
          await import("#src/routes/index-router.js");
        const app = express();
        app.use(indexRouter);
        const response = await request(app).get("/auth/google");

        expect(response.statusCode).toBe(302);
        expect(response.header["location"]).toMatch(
          "https://accounts.google.com/o/oauth2/v2/auth",
        );
      });
    });
  });

  describe("google callback url GET /auth/google/callback", () => {
    describe("given a valid consent", () => {
      it("should return a jwt and a user object", async () => {
        expect.hasAssertions();

        vi.spyOn(passport, "authenticate").mockReturnValue(
          (req: Request, _res: Response, next: NextFunction) => {
            req.user = {
              id: "test-userId",
              email: "test-email@test.com",
              fullName: "test: full name",
              password: null,
            };
            next();
          },
        );
        const { default: indexRouter } =
          await import("#src/routes/index-router.js");
        const app = express();
        app.use(indexRouter);

        const response = await request(app).get("/auth/google/callback");

        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual<AuthenticatedResponse>({
          token: expect.any(String) as string,
          user: {
            id: "test-userId",
            email: "test-email@test.com",
            fullName: "test: full name",
            password: null,
          },
        });
      });
    });
  });
});
