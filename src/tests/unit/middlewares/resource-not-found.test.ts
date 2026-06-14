import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import resourceNotFound from "#src/middlewares/resource-not-found.js";

describe("resourceNotFound middleware", () => {
  const app = express();
  app.use(resourceNotFound);

  interface NotFoundError {
    error: string;
  }

  it("should return 404 status with error message when requesting an unknown resource", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .get("/non-existing")
      .expect("Content-type", /json/)
      .expect(404);

    expect(response.body).toStrictEqual<NotFoundError>({
      error: "Resource not found.",
    });
  });
});
