import express from "express";
import request from "supertest";
import validateContentType from "#src/middlewares/validate-content-type.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe(validateContentType, () => {
  const app = express();

  beforeAll(() => {
    app.use(validateContentType);
    app.post("/test", (_req, res) => {
      res.json("POST: test");
    });
    app.get("/test", (_req, res) => {
      res.json("GET: test");
    });
  });

  it("should call the next request handler when request doesn't have Content-length regardless of Content-Type", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .get("/test")
      .type("form")
      .expect("Content-type", /json/)
      .expect(200);

    expect(response.body).toBe("GET: test");
  });

  it("should call the next request handler when request Content-Type is supported", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .post("/test")
      .type("json")
      .expect("Content-type", /json/)
      .expect(200);

    expect(response.body).toBe("POST: test");
  });

  it("should return a 415 status with error message when Content-Type is not supported", async () => {
    expect.hasAssertions();

    const response = await request(app)
      .post("/test")
      .type("text")
      .expect("Content-type", /json/)
      .expect(415);

    expect(response.body).toStrictEqual<ClientError>({
      errors: [
        {
          message:
            "Server only supports application/json or multipart/form-data media types.",
        },
      ],
    });
  });
});
