import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { User } from "#src/types/routes/users.js";
import type { ClientError } from "#src/types/errors/errors.js";

describe("/comments/{commentId} path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  let currentUser: User;
  let commentId: string;
  let currentUserToken: string;

  beforeEach(async () => {
    currentUser = await userQueries.createUserLocal({
      email: "test-email@test.com",
      fullName: "test: full name",
      password: "test-password",
    });
    const post = await postQueries.createPost({
      title: "test: post title",
      content: "test: post content",
      imageId: null,
      imageUrl: null,
      userId: currentUser.id,
    });
    const { id } = await commentQueries.createComment({
      content: "test: comment content",
      postId: post.id,
      userId: currentUser.id,
    });
    commentId = id;

    currentUserToken = issueJwt(currentUser.id);
  });

  describe("update comment PATCH", () => {
    it("should return 404 status with error message when comment doesn't exist", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .patch("/comments/non-existing-id")
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: comment content" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Comment not found." }],
      });
    });

    it("should return 400 status with error message when given invalid inputs", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .patch(`/comments/${commentId}`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "" })
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Comment content cannot be empty." }],
      });
    });

    it("should return 204 status when comment is updated", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .patch(`/comments/${commentId}`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: updated comment content" });

      expect(response.noContent).toBe(true);
    });
  });

  describe("delete comment DELETE", () => {
    it("should return 404 status with error message when comment doesn't exist", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .delete("/comments/non-existing-id")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Comment not found." }],
      });
    });

    it("should return 204 status comment is deleted", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .delete(`/comments/${commentId}`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: updated comment content" });

      expect(response.noContent).toBe(true);
    });
  });
});
