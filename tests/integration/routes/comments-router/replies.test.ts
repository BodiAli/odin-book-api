import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import prisma from "#src/db/prisma-client.js";
import utils from "#test-utils/websocket-utils.js";
import type { User } from "#src/types/routes/users.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { Post } from "#src/types/routes/posts.js";
import type {
  Comments,
  CreateReplyResponse,
  GetCommentRepliesResponse,
} from "#src/types/routes/comments.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

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

  type Author = Comments[number]["author"];
  interface JsonAuthor extends Omit<Author, "lastSeen"> {
    lastSeen: string;
  }
  type JsonReplies = (Omit<Comments[number], "createdAt" | "author"> & {
    createdAt: string;
    author: JsonAuthor;
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
          isLiked: false,
          likes: 0,
          author: {
            id: currentUser.id,
            fullName: currentUser.fullName,
            isOnline: currentUser.isOnline,
            lastSeen: expect.any(String) as string,
            picture: currentUser.picture,
          },
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

  describe("create reply POST", () => {
    it("should return 404 status with error message when comment is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/comments/non-existing-id/replies")
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: reply content", postId: post.id })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Parent comment not found." }],
      });
    });

    it("should return 404 status with error message when post is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: reply content", postId: "non-existing-id" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Post not found." }],
      });
    });

    it("should return 400 status with error message when given invalid inputs", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "", postId: "" })
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          { message: "Comment content cannot be empty." },
          { message: "Post ID cannot be empty." },
        ],
      });
    });

    it("should return 201 status with reply id when reply is created", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: reply content", postId: post.id })
        .expect("Content-type", /json/)
        .expect(201);

      expect(response.body).toStrictEqual<CreateReplyResponse>({
        id: expect.any(String) as string,
      });
    });

    it("should return location header", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: reply content", postId: post.id })
        .expect("Content-type", /json/)
        .expect(201);

      expect(response.headers["location"]).toMatch(/^\/comments\/.+$/);
    });

    it("should send notification to the comment author", async () => {
      expect.hasAssertions();

      const userB = await userQueries.createUserLocal({
        email: "test-userB@test.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const userBComment = await commentQueries.createComment({
        userId: userB.id,
        content: "test: userB comment content",
        postId: post.id,
      });
      const userBToken = issueJwt(userB.id);
      await utils.initiateWebSocketServer();
      const ws = await utils.connectClient(userBToken);
      const waitForMessage = utils.waitForMessage<SentNotification>(ws);

      const response = await request(app)
        .post(`/comments/${userBComment.id}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: reply content", postId: post.id })
        .expect("Content-type", /json/)
        .expect(201);
      const typedBody = response.body as CreateReplyResponse;
      const msg = await waitForMessage;
      interface JsonNotification extends Omit<SentNotification, "createdAt"> {
        createdAt: string;
      }

      expect(msg.data).toStrictEqual<JsonNotification>({
        id: expect.any(String) as string,
        actorId: currentUser.id,
        actorProfilePicture: null,
        createdAt: expect.any(String) as string,
        message:
          'test: full name replied to your comment "test: userB comment content"',
        target: {
          type: "REPLY",
          parentCommentId: userBComment.id,
          postId: post.id,
          commentId: typedBody.id,
        },
      });

      await utils.cleanupConnection();
    });

    it("should not send notification when the comment and reply author are the same", async () => {
      expect.hasAssertions();

      await utils.initiateWebSocketServer();
      const ws = await utils.connectClient(currentUserToken);
      const waitForMessage = utils.waitForMessage<SentNotification>(ws);

      await request(app)
        .post(`/comments/${commentId}/replies`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: reply content", postId: post.id })
        .expect("Content-type", /json/)
        .expect(201);

      await expect(waitForMessage).rejects.toThrow(
        new Error("No message received"),
      );

      await utils.cleanupConnection();
    });
  });
});
