import express from "express";
import request from "supertest";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import indexRouter from "#src/routes/index-router.js";
import type {
  CreatePostRequestBody,
  CreatePostResponseBody,
} from "#src/types/routes/posts.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { User } from "#src/types/routes/users.js";

describe("/posts path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  let currentUserToken: string;
  let currentUser: User;

  beforeEach(async () => {
    currentUser = await userQueries.createUserLocal({
      email: "test-currentUser@test.com",
      fullName: "test: currentUser",
      password: "test-currentUser-password",
    });
    currentUserToken = issueJwt(currentUser.id);
  });

  describe("create new post POST", () => {
    it("should return 400 status with error messages when given invalid inputs", async () => {
      expect.hasAssertions();

      const requestBody: CreatePostRequestBody = {
        content: "",
        title: "1".repeat(256),
      };

      const response = await request(app)
        .post("/posts")
        .auth(currentUserToken, { type: "bearer" })
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "Post title cannot exceed 255 characters.",
          },
          {
            message: "Post content cannot be empty.",
          },
        ],
      });
    });

    it("should return 201 with created post when given valid inputs", async () => {
      expect.hasAssertions();

      const requestBody: CreatePostRequestBody = {
        content: "test: post content",
        title: "test: post title",
      };

      const response = await request(app)
        .post("/posts")
        .auth(currentUserToken, { type: "bearer" })
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(201);

      expect(response.body).toStrictEqual<CreatePostResponseBody>({
        post: {
          id: expect.any(String) as string,
          userId: currentUser.id,
          title: "test: post title",
          content: "test: post content",
          createdAt: expect.any(String) as Date,
          imageId: null,
          imageUrl: null,
          author: {
            id: currentUser.id,
            fullName: "test: currentUser",
            lastSeen: expect.any(String) as Date,
            isOnline: true,
            picture: null,
          },
        },
      });
    });
  });
});
