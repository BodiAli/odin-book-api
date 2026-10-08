import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { User } from "#src/types/routes/users.js";
import type { GetPostResponseBody, Post } from "#src/types/routes/posts.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("/posts/:postId path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  let currentUser: User;
  let currentUserToken: string;
  let post: Post;

  beforeEach(async () => {
    currentUser = await userQueries.createUserLocal({
      email: "test-currentUser@test.com",
      fullName: "test: currentUser",
      password: "test-currentUser-password",
    });
    post = await postQueries.createPost({
      userId: currentUser.id,
      title: "test: post title",
      content: "test: post content",
      imageId: null,
      imageUrl: null,
    });
    currentUserToken = issueJwt(currentUser.id);
  });

  describe("get a single post GET", () => {
    it("should return 404 with error message when post does not exists", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get("/posts/non-existent-id")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "Post not found.",
          },
        ],
      });
    });

    it("should return status 200 with post", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get(`/posts/${post.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<GetPostResponseBody>({
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
