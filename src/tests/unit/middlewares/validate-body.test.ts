import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import request from "supertest";
import express from "express";
import validateBody from "#src/middlewares/validate-body.js";
import type { ClientError } from "#src/schemas/error-schemas.js";

describe("validate body middleware", () => {
  const app = express();
  app.use(express.json());

  beforeAll(() => {
    app.post(
      "/test",
      validateBody(
        z.object({
          username: z
            .string("Please provide a string username.")
            .max(4, "Username cannot exceed 4 characters."),
        }),
      ),
      (_req, res) => {
        res.json("Passed");
      },
    );
  });

  it("should return 400 status when req.body doesn't match the schema", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .post("/test")
      .send({ username: "test-username" });

    expect(response.badRequest).toBe(true);
  });

  it("should return 'Please provide a string username' when req.body doesn't have a username", async () => {
    expect.hasAssertions();

    const response = await request(app).post("/test").send({});

    expect(response.body).toStrictEqual<ClientError>({
      errors: [
        {
          message: "Please provide a string username.",
        },
      ],
    });
  });

  it("should return 'Username cannot exceed 4 characters' when req.body.username is more than 4 characters", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .post("/test")
      .send({ username: "test-username" });

    expect(response.body).toStrictEqual<ClientError>({
      errors: [
        {
          message: "Username cannot exceed 4 characters.",
        },
      ],
    });
  });

  it("should call the next request handler when req.body matches the schema", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .post("/test")
      .send({ username: "test" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Passed");
  });
});
