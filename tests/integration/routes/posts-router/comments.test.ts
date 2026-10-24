import express from "express";
import request from "supertest";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import indexRouter from "#src/routes/index-router.js";
import issueJwt from "#src/utils/issue-jwt.js";
import prisma from "#src/db/prisma-client.js";
import utils from "#test-utils/websocket-utils.js";
import type { User } from "#src/types/routes/users.js";
import type {
  CreatePostCommentResponse,
  GetPostCommentsResponse,
  Post,
} from "#src/types/routes/posts.js";
import type { ClientError } from "#src/types/errors/errors.js";
import type { Comments } from "#src/types/routes/comments.js";
import type { SentNotification } from "#src/types/routes/notifications.js";

describe("/posts/{postId}/comments path", () => {
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

  type JsonComments = (Omit<Comments[number], "createdAt"> & {
    createdAt: string;
  })[];

  describe("get post comments GET", () => {
    it("should return 404 status with error message when post is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get("/posts/non-existing-id/comments")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Post not found." }],
      });
    });

    it("should return 200 status with post comments", async () => {
      expect.hasAssertions();

      await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: currentUser.id,
      });

      const response = await request(app)
        .get(`/posts/${post.id}/comments`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedBody = response.body as GetPostCommentsResponse;

      expect(typedBody.comments).toStrictEqual<JsonComments>([
        {
          id: expect.any(String) as string,
          content: "test: comment content",
          createdAt: expect.any(String) as string,
          hasReplies: false,
          parentId: null,
          postId: post.id,
          userId: currentUser.id,
          isLiked: false,
          likes: 0,
        },
      ]);
    });

    it("should return 200 status with metadata about the next cursor", async () => {
      expect.hasAssertions();

      await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: currentUser.id,
      });

      const response = await request(app)
        .get(`/posts/${post.id}/comments`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedBody = response.body as GetPostCommentsResponse;

      expect(typedBody.metadata).toStrictEqual({
        nextCursorId: null,
      });
    });

    it("should return 404 status with error message when passing a non-existing last_cursor_id query param", async () => {
      expect.hasAssertions();

      await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: currentUser.id,
      });

      const response = await request(app)
        .get(`/posts/${post.id}/comments?last_cursor_id=non-existing-id`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Cursor not found." }],
      });
    });

    it("should return 200 status nextCursorId to allow for cursor based pagination", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 30 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: comment content ${String(i)}`,
              postId: post.id,
              userId: currentUser.id,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );

      const response1 = (
        await request(app)
          .get(`/posts/${post.id}/comments`)
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200)
      ).body as GetPostCommentsResponse;
      assert(response1.metadata.nextCursorId);
      const response2 = (
        await request(app)
          .get(
            `/posts/${post.id}/comments?last_cursor_id=${response1.metadata.nextCursorId}`,
          )
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200)
      ).body as GetPostCommentsResponse;
      assert(response2.metadata.nextCursorId);
      const response3 = (
        await request(app)
          .get(
            `/posts/${post.id}/comments?last_cursor_id=${response2.metadata.nextCursorId}`,
          )
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200)
      ).body as GetPostCommentsResponse;
      assert(response1.comments[9]);
      assert(response2.comments[9]);
      assert(response3.comments[9]);
      const response1LastComment = response1.comments[9];
      const response2LastComment = response2.comments[9];
      const response3LastComment = response3.comments[9];

      expect(response1LastComment.content).toBe("test: comment content 20");
      expect(response2LastComment.content).toBe("test: comment content 10");
      expect(response3LastComment.content).toBe("test: comment content 0");
      expect(response3.metadata.nextCursorId).toBeNull();
    });
  });

  describe("create comment for a post POST", () => {
    it("should return a 404 status with error message when post is not found", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post("/posts/non-existing-id/comments")
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: comment content" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Post not found." }],
      });
    });

    it("should return a 400 status with error message when given invalid inputs", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "" })
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Comment content cannot be empty." }],
      });
    });

    it("should 201 status with comment id", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .post(`/posts/${post.id}/comments`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: comment content" })
        .expect("Content-type", /json/)
        .expect(201);

      expect(response.body).toStrictEqual<CreatePostCommentResponse>({
        id: expect.any(String) as string,
      });
    });

    it("should send notification to the post author", async () => {
      expect.hasAssertions();

      const userB = await userQueries.createUserLocal({
        email: "test-userB@test.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const userBPost = await postQueries.createPost({
        userId: userB.id,
        title: "test: userB post title",
        content: "test: userB post content",
        imageId: null,
        imageUrl: null,
      });
      const userBToken = issueJwt(userB.id);
      await utils.initiateWebSocketServer();
      const ws = await utils.connectClient(userBToken);
      const waitForMessage = utils.waitForMessage<SentNotification>(ws);

      await request(app)
        .post(`/posts/${userBPost.id}/comments`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: comment content" })
        .expect("Content-type", /json/)
        .expect(201);
      const msg = await waitForMessage;
      interface JsonNotification extends Omit<SentNotification, "createdAt"> {
        createdAt: string;
      }

      expect(msg.data).toStrictEqual<JsonNotification>({
        id: expect.any(String) as string,
        type: "COMMENT",
        actorId: currentUser.id,
        actorProfilePicture: null,
        createdAt: expect.any(String) as string,
        entityId: userBPost.id,
        message:
          'test: currentUser commented on your post "test: userB post title"',
      });

      await utils.cleanupConnection();
    });

    it("should not send notification when the comment and post author are the same", async () => {
      expect.hasAssertions();

      await utils.initiateWebSocketServer();
      const ws = await utils.connectClient(currentUserToken);
      const waitForMessage = utils.waitForMessage<SentNotification>(ws);

      await request(app)
        .post(`/posts/${post.id}/comments`)
        .auth(currentUserToken, { type: "bearer" })
        .send({ content: "test: comment content" })
        .expect("Content-type", /json/)
        .expect(201);

      await expect(waitForMessage).rejects.toThrow(
        new Error("No message received"),
      );

      await utils.cleanupConnection();
    });
  });
});
