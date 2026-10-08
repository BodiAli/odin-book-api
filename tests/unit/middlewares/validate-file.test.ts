import express from "express";
import z from "zod";
import request from "supertest";
import multer from "multer";
import validateFile from "#src/middlewares/validate-file.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("validate file middleware", () => {
  const app = express();
  const upload = multer();

  beforeAll(() => {
    app.post(
      "/test",
      upload.single("testFile"),
      validateFile(
        z.object({
          size: z.number().max(5 * 2 ** 20, "File cannot exceed 5MiB."),
          mimetype: z
            .string()
            .startsWith("image/", "File must be of type image."),
        }),
      ),
      (_req, res) => {
        res.json({ passed: true });
      },
    );
  });

  it("should return 400 status when file is not valid", async () => {
    expect.hasAssertions();

    const file = Buffer.alloc(5 * 2 ** 20 + 1);
    const response = await request(app)
      .post("/test")
      .attach("testFile", file, {
        contentType: "application/json",
        filename: "test-file",
      })
      .expect("Content-type", /json/)
      .expect(400);

    expect(response.body).toStrictEqual<ClientError>({
      errors: [
        {
          message: "File cannot exceed 5MiB.",
        },
        {
          message: "File must be of type image.",
        },
      ],
    });
  });

  it("should call the next request handler when schema is valid", async () => {
    expect.hasAssertions();

    const file = Buffer.alloc(5 * 2 ** 20);
    const response = await request(app)
      .post("/test")
      .attach("testFile", file, {
        contentType: "image/jpg",
        filename: "test-file",
      })
      .expect("Content-type", /json/)
      .expect(200);

    expect(response.body).toStrictEqual({
      passed: true,
    });
  });
});
