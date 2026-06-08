import supertest from "supertest";
import express, { Router } from "express";
import { describe, expect, it, vi } from "vitest";
import indexRouter from "#src/routes/index-router.js";

vi.mock(import("#src/routes/auth-router.js"), () => {
  const router = Router();
  router.post("/sign-up", (_req, res) => {
    res.json({ mocked: true });
  });
  return {
    default: router,
  };
});

describe("index-router routes", () => {
  const app = express();
  app.use("/", indexRouter);

  interface Mocked {
    mocked: true;
  }

  describe("auth-router", () => {
    it("should mount authRouter on the /auth path", async () => {
      expect.hasAssertions();

      const response = await supertest(app).post("/auth/sign-up");

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });
});
