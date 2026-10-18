import express from "express";
import request from "supertest";
import resourceNotFound from "#src/errors/resource-not-found.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("resourceNotFound middleware", () => {
  const app = express();

  beforeAll(() => {
    app.use(resourceNotFound);
  });

  it("should return 404 status with error message when requesting an unknown resource", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .get("/non-existing")
      .expect("Content-type", /json/)
      .expect(404);

    expect(response.body).toStrictEqual<ClientError>({
      errors: [{ message: "Resource not found." }],
    });
  });
});
