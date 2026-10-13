import express from "express";
import request from "supertest";
import jsonErrorHandler from "#src/errors/json-error-handler.js";
import errorHandler from "#src/errors/error-handler.js";
import type { ClientError, ServerError } from "#src/types/errors/errors.js";

describe(jsonErrorHandler, () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.get("/error", () => {
      throw new Error("test");
    });
    app.use(jsonErrorHandler);
    app.use(errorHandler);
  });

  it("should catch error thrown by express.json when JSON is not object or array", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .post("/test")
      .send("text")
      .type("json")
      .expect("Content-type", /json/)
      .expect(400);

    expect(response.body).toStrictEqual<ClientError>({
      errors: [{ message: "Invalid JSON." }],
    });
  });

  it("should catch error thrown by express.json when JSON is invalid", async () => {
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

  it("should send the error to the generic error handler if the error is not thrown by express.json", async () => {
    expect.hasAssertions();

    vi.spyOn(console, "error").mockImplementation(() => null);

    const response = await request(app)
      .get("/error")
      .expect("Content-type", /json/)
      .expect(500);

    expect(response.body).toStrictEqual<ServerError>({
      error: "test",
    });
  });
});
