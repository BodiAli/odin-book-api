import supertest from "supertest";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import issueJwt from "#src/utils/issue-jwt.js";

vi.mock(import("#src/routes/auth-router.js"), () => {
  const router = express.Router();
  router.post("/sign-up", (_req, res) => {
    res.json({ mocked: true });
  });
  return {
    default: router,
  };
});

vi.mock(import("#src/routes/users-router.js"), () => {
  const router = express.Router();
  router.get("/", (_req, res) => {
    res.json({ mocked: true });
  });
  return {
    default: router,
  };
});

describe("index-router mount endpoints", () => {
  const app = express();
  app.use("/", indexRouter);

  interface Mocked {
    mocked: true;
  }

  describe("auth-router", () => {
    it("should mount authRouter on the /auth path", async () => {
      expect.hasAssertions();

      const response = await supertest(app).post("/auth/sign-up").expect(200);

      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });

  describe("users-router", () => {
    it("should authenticate jwt", async () => {
      expect.hasAssertions();

      const response = await supertest(app).get("/users");

      expect(response.unauthorized).toBe(true);
    });

    it("should mount usersRouter on /users path", async () => {
      expect.hasAssertions();

      const currentUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });
      const currentUserToken = issueJwt(currentUser.id, "10m");

      const response = await supertest(app)
        .get("/users")
        .auth(currentUserToken, { type: "bearer" })
        .expect(200);

      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });
});
