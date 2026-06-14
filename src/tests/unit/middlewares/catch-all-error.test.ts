import request from "supertest";
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import genericErrorHandler from "#src/middlewares/generic-error-handler.js";
import type { ServerError } from "#src/schemas/errors/error-schemas.js";

describe(genericErrorHandler, () => {
  const app = express();

  beforeEach(() => {
    app.get("/test", (_req, _res, next) => {
      next(new Error("test: error thrown"));
    });
    app.use(genericErrorHandler);
    vi.spyOn(console, "error").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should call console.error", async () => {
    expect.hasAssertions();

    const spyConsoleError = vi.spyOn(console, "error");

    await request(app).get("/test");

    expect(spyConsoleError).toHaveBeenCalledExactlyOnceWith(
      new Error("test: error thrown"),
    );
  });

  it("should return a 500 status code", async () => {
    expect.hasAssertions();

    const response = await request(app).get("/test");

    expect(response.statusCode).toBe(500);
  });

  it("should return a response body with the error message", async () => {
    expect.hasAssertions();

    const response = await request(app).get("/test");

    expect(response.body).toStrictEqual<ServerError>({
      error: "test: error thrown",
    });
  });
});
