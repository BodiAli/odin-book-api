import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as likeQueries from "#src/queries/like-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { User } from "#src/types/routes/users.js";
import type {
  GetNumberOfPostLikesResponse,
  Post,
} from "#src/types/routes/posts.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("/posts/{postId}/likes path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  let currentUser: User;
  let post: Post;
  let currentUserToken: string;

  beforeEach(async () => {
    currentUser = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    post = await postQueries.createPost({
      title: "test: post title",
      content: "test: post content",
      imageId: null,
      imageUrl: null,
      userId: currentUser.id,
    });

    currentUserToken = issueJwt(currentUser.id);
  });

  describe("like post POST", () => {
    it("should return 404 status with error message when post is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/posts/non-existing-id/likes")
        .auth(currentUserToken, { type: "bearer" })
        .type("json")
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No post found to like." }],
      });
    });

    it("should return 403 status with error message when liking post twice", async () => {
      expect.hasAssertions();

      await request(app)
        .post(`/posts/${post.id}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .type("json")
        .expect(204);

      const response2 = await request(app)
        .post(`/posts/${post.id}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .type("json")
        .expect("Content-type", /json/)
        .expect(409);

      expect(response2.body).toStrictEqual<ClientError>({
        errors: [{ message: "You can’t like post twice." }],
      });
    });

    it("should return 204 status post is liked successfully", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/posts/${post.id}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .type("json");

      expect(response.noContent).toBe(true);
    });
  });

  describe("get number of post likes GET", () => {
    it("should return 404 status with error message when post is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get("/posts/non-existing-id/likes")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Post not found." }],
      });
    });

    it("should return 200 status with number of post likes", async () => {
      expect.hasAssertions();

      await likeQueries.createPostLike(currentUser.id, post.id);

      const response = await request(app)
        .get(`/posts/${post.id}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);

      expect(response.body).toStrictEqual<GetNumberOfPostLikesResponse>({
        likes: 1,
      });
    });
  });

  describe("unlike post DELETE", () => {
    it("should return 404 status with error message when post is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .delete("/posts/non-existing-id/likes")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No post found to unlike." }],
      });
    });

    it("should return 404 status with error message when like is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .delete(`/posts/${post.id}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No like found to delete." }],
      });
    });

    it("should return 204 status when post is unliked", async () => {
      expect.hasAssertions();

      await likeQueries.createPostLike(currentUser.id, post.id);

      const response = await request(app)
        .delete(`/posts/${post.id}/likes`)
        .auth(currentUserToken, { type: "bearer" });

      expect(response.noContent).toBe(true);
    });
  });
});
