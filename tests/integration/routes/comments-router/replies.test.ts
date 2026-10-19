import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import prisma from "#src/db/prisma-client.js";
import type { User } from "#src/types/routes/users.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { Post } from "#src/types/routes/posts.js";
import type {
  Comments,
  GetCommentRepliesResponse,
} from "#src/types/routes/comments.js";

describe("/comments/{commentId}/replies path", () => {
  const app = express();

  beforeAll(() => {
    app.use(indexRouter);
  });

  let currentUser: User;
  let post: Post;
  let commentId: string;
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
    const { id } = await commentQueries.createComment({
      content: "test: comment content",
      postId: post.id,
      userId: currentUser.id,
    });
    commentId = id;

    currentUserToken = issueJwt(currentUser.id);
  });

  type JsonReplies = (Omit<Comments[number], "createdAt"> & {
    createdAt: string;
  })[];

  describe("get comment replies GET", () => {
    it("should return 404 status with error message when comment is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get("/comments/non-existing-id/replies")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Comment not found." }],
      });
    });

    it("should return 200 status with comment replies", async () => {
      expect.hasAssertions();

      await commentQueries.createReply({
        content: "test: reply content",
        postId: post.id,
        userId: currentUser.id,
        parentId: commentId,
      });

      const response = await request(app)
        .get(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedBody = response.body as GetCommentRepliesResponse;

      expect(typedBody.replies).toStrictEqual<JsonReplies>([
        {
          id: expect.any(String) as string,
          content: "test: reply content",
          createdAt: expect.any(String) as string,
          hasReplies: false,
          parentId: commentId,
          postId: post.id,
          userId: currentUser.id,
        },
      ]);
    });

    it("should return 200 status with metadata about the next cursor", async () => {
      expect.hasAssertions();

      await commentQueries.createReply({
        content: "test: reply content",
        postId: post.id,
        userId: currentUser.id,
        parentId: commentId,
      });

      const response = await request(app)
        .get(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedBody = response.body as GetCommentRepliesResponse;

      expect(typedBody.metadata).toStrictEqual({
        nextCursorId: null,
      });
    });

    it("should return 404 status with error message when passing a non-existing last_cursor_id query param", async () => {
      expect.hasAssertions();

      await commentQueries.createReply({
        content: "test: reply content",
        postId: post.id,
        userId: currentUser.id,
        parentId: commentId,
      });

      const response = await request(app)
        .get(`/comments/${commentId}/replies?last_cursor_id=non-existing-id`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Cursor not found." }],
      });
    });

    it("should return 200 status with nextCursorId to allow for cursor based pagination", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 30 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: reply content ${String(i)}`,
              postId: post.id,
              userId: currentUser.id,
              parentId: commentId,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );

      const response1 = (
        await request(app)
          .get(`/comments/${commentId}/replies`)
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200)
      ).body as GetCommentRepliesResponse;
      assert(response1.metadata.nextCursorId);
      const response2 = (
        await request(app)
          .get(
            `/comments/${commentId}/replies?last_cursor_id=${response1.metadata.nextCursorId}`,
          )
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200)
      ).body as GetCommentRepliesResponse;
      assert(response2.metadata.nextCursorId);
      const response3 = (
        await request(app)
          .get(
            `/comments/${commentId}/replies?last_cursor_id=${response2.metadata.nextCursorId}`,
          )
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200)
      ).body as GetCommentRepliesResponse;
      assert(response1.replies[9]);
      assert(response2.replies[9]);
      assert(response3.replies[9]);
      const response1LastComment = response1.replies[9];
      const response2LastComment = response2.replies[9];
      const response3LastComment = response3.replies[9];

      expect(response1LastComment.content).toBe("test: reply content 20");
      expect(response2LastComment.content).toBe("test: reply content 10");
      expect(response3LastComment.content).toBe("test: reply content 0");
      expect(response3.metadata.nextCursorId).toBeNull();
    });
  });
});
