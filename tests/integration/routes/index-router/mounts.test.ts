import request from "supertest";
import express from "express";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { ClientError } from "#src/types/errors/errors.js";

vi.mock(import("#src/routes/tokens-router.js"), () => {
  const router = express.Router();
  router.get("/", (_req, res) => {
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

vi.mock(import("#src/routes/notifications-router.js"), () => {
  const router = express.Router();
  router.get("/", (_req, res) => {
    res.json({ mocked: true });
  });

  return {
    default: router,
  };
});

vi.mock(import("#src/routes/posts-router.js"), () => {
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

  beforeAll(() => {
    app.use(indexRouter);
  });

  interface Mocked {
    mocked: true;
  }

  describe("validate-content-type", () => {
    it("should mount validateContentType", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/test")
        .type("form")
        .expect("Content-type", /json/)
        .expect(415);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          { message: "Server only supports application/json media type." },
        ],
      });
    });
  });

  describe("json-error-handler", () => {
    it("should mount jsonErrorHandler", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/test")
        .send('{"invalid": }')
        .type("json")
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Invalid JSON." }],
      });
    });
  });

  describe("tokens-router", () => {
    it("should mount tokensRouter on the /tokens path", async () => {
      expect.hasAssertions();

      const response = await request(app).get("/tokens").expect(200);

      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });

  describe("users-router", () => {
    it("should mount usersRouter on /users path", async () => {
      expect.hasAssertions();

      const currentUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });
      const currentUserToken = issueJwt(currentUser.id, "10m");

      const response = await request(app)
        .get("/users")
        .auth(currentUserToken, { type: "bearer" })
        .expect(200);

      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });

  describe("notifications-router", () => {
    it("should authenticate JWT", async () => {
      expect.hasAssertions();

      const response = await request(app).get("/notifications");

      expect(response.unauthorized).toBe(true);
    });

    it("should mount notificationsRouter on /notifications path", async () => {
      expect.hasAssertions();

      const currentUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });
      const currentUserToken = issueJwt(currentUser.id, "10m");

      const response = await request(app)
        .get("/users")
        .auth(currentUserToken, {
          type: "bearer",
        })
        .expect(200);

      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });

  describe("posts-router", () => {
    it("should authenticate JWT", async () => {
      expect.hasAssertions();

      const response = await request(app).get("/posts");

      expect(response.unauthorized).toBe(true);
    });

    it("should mount postsRouter on /posts path", async () => {
      expect.hasAssertions();

      const currentUser = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });
      const currentUserToken = issueJwt(currentUser.id);

      const response = await request(app)
        .get("/posts")
        .auth(currentUserToken, { type: "bearer" })
        .expect(200);

      expect(response.body).toStrictEqual<Mocked>({
        mocked: true,
      });
    });
  });
});
