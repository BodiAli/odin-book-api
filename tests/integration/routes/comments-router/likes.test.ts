import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as likeQueries from "#src/queries/like-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("/comments/{commentId}/likes path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  let currentUserId: string;
  let commentId: string;
  let currentUserToken: string;

  beforeEach(async () => {
    const currentUser = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    currentUserId = currentUser.id;
    const post = await postQueries.createPost({
      title: "test: post title",
      content: "test: post content",
      imageUrl: null,
      imageId: null,
      userId: currentUser.id,
    });
    const comment = await commentQueries.createComment({
      content: "test: comment content",
      userId: currentUser.id,
      postId: post.id,
    });
    commentId = comment.id;
    currentUserToken = issueJwt(currentUser.id);
  });

  describe("like comment POST", () => {
    it("should return 404 status with error message when comment is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/comments/non-existing-id/likes")
        .auth(currentUserToken, { type: "bearer" })
        .type("json")
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No comment found to like." }],
      });
    });

    it("should return 409 status with error message when comment is not found", async () => {
      expect.hasAssertions();

      await request(app)
        .post(`/comments/${commentId}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .type("json")
        .expect(204);

      const response = await request(app)
        .post(`/comments/${commentId}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .type("json")
        .expect("Content-type", /json/)
        .expect(409);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "You can’t like comment twice." }],
      });
    });

    it("should return 204 status when comment is liked", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/comments/${commentId}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .type("json");

      expect(response.noContent).toBe(true);
    });
  });

  describe("unlike comment DELETE", () => {
    it("should return 404 status with error message when comment is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .delete("/comments/non-existing-id/likes")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No comment found to unlike." }],
      });
    });

    it("should return 404 status with error message when like is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .delete(`/comments/${commentId}/likes`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No like found to delete." }],
      });
    });

    it("should return 204 status when comment is unliked", async () => {
      expect.hasAssertions();

      await likeQueries.createCommentLike(currentUserId, commentId);

      const response = await request(app)
        .delete(`/comments/${commentId}/likes`)
        .auth(currentUserToken, { type: "bearer" });

      expect(response.noContent).toBe(true);
    });
  });
});
