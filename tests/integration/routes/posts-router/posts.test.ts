import express from "express";
import request from "supertest";
import * as userQueries from "#src/queries/user-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import indexRouter from "#src/routes/index-router.js";
import prisma from "#src/db/prisma-client.js";
import type {
  CreatePostRequestBody,
  CreatePostResponseBody,
  GetIndexPostsResponseBody,
  Post,
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

    it.todo("multipart form");
  });

  describe("get index posts for index page GET", () => {
    it("should throw an error when last_cursor_id is not a valid post id", async () => {
      expect.hasAssertions();

      const response = await request(app)
        .get("/posts?last_cursor_id=non-existing-id")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          {
            message: "Cursor not found.",
          },
        ],
      });
    });

    it("should return n<=10 posts immediately created after the last cursor post when last_cursor_id is passed", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2025-01-01T01:00:00Z");
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => {
          return prisma.post.create({
            data: {
              title: `test: post title ${String(i)}`,
              content: `test: post content ${String(i)}`,
              createdAt: new Date(baseDate.getTime() + i),
              userId: currentUser.id,
            },
          });
        }),
      );
      const cursorPost = await prisma.post.findFirstOrThrow({
        where: {
          title: "test: post title 10",
        },
      });

      const response = await request(app)
        .get(`/posts?last_cursor_id=${cursorPost.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedResponseBody = response.body as GetIndexPostsResponseBody;

      expect(typedResponseBody.posts).toHaveLength(10);
      expect(typedResponseBody.posts[0]).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: currentUser.id,
        title: "test: post title 9",
        content: "test: post content 9",
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
      });
      expect(typedResponseBody.posts[9]).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: currentUser.id,
        title: "test: post title 0",
        content: "test: post content 0",
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
      });
    });

    it("should return metadata about whether there are remaining posts or not", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2025-01-01T01:00:00Z");
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => {
          return prisma.post.create({
            data: {
              title: `test: post title ${String(i)}`,
              content: `test: post content ${String(i)}`,
              createdAt: new Date(baseDate.getTime() + i),
              userId: currentUser.id,
            },
          });
        }),
      );
      const cursorPost = await prisma.post.findFirstOrThrow({
        where: {
          title: "test: post title 11",
        },
      });
      const nextCursor = await prisma.post.findFirstOrThrow({
        where: {
          title: "test: post title 1",
        },
      });
      const response = await request(app)
        .get(`/posts?last_cursor_id=${cursorPost.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedResponseBody = response.body as GetIndexPostsResponseBody;

      expect(typedResponseBody.metadata).toStrictEqual<
        GetIndexPostsResponseBody["metadata"]
      >({
        hasNextPage: true,
        nextCursorId: nextCursor.id,
      });
    });

    it("should return n<=10 posts sorted by newest to oldest when last_cursor_id is not passed", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2025-01-01T01:00:00Z");
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => {
          return prisma.post.create({
            data: {
              title: `test: post title ${String(i)}`,
              content: `test: post content ${String(i)}`,
              createdAt: new Date(baseDate.getTime() + i),
              userId: currentUser.id,
            },
          });
        }),
      );

      const response = await request(app)
        .get("/posts")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedResponseBody = response.body as GetIndexPostsResponseBody;

      expect(typedResponseBody.posts).toHaveLength(10);
      expect(typedResponseBody.posts[0]).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: currentUser.id,
        title: "test: post title 19",
        content: "test: post content 19",
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
      });
      expect(typedResponseBody.posts[9]).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: currentUser.id,
        title: "test: post title 10",
        content: "test: post content 10",
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
      });
    });

    it("should return remaining posts when chaining calls when passing las_cursor_id", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2025-01-01T01:00:00Z");
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => {
          return prisma.post.create({
            data: {
              title: `test: post title ${String(i)}`,
              content: `test: post content ${String(i)}`,
              createdAt: new Date(baseDate.getTime() + i),
              userId: currentUser.id,
            },
          });
        }),
      );

      const firstResponse = await request(app)
        .get("/posts")
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedFirstResponseBody =
        firstResponse.body as GetIndexPostsResponseBody;
      assert(typedFirstResponseBody.metadata.nextCursorId);
      const secondResponse = await request(app)
        .get(
          `/posts?last_cursor_id=${typedFirstResponseBody.metadata.nextCursorId}`,
        )
        .auth(currentUserToken, { type: "bearer" })
        .expect("Content-type", /json/)
        .expect(200);
      const typedSecondResponseBody =
        secondResponse.body as GetIndexPostsResponseBody;

      expect(typedSecondResponseBody.posts).toHaveLength(10);
      expect(typedSecondResponseBody.posts[0]).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: currentUser.id,
        title: "test: post title 9",
        content: "test: post content 9",
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
      });
      expect(typedSecondResponseBody.posts[9]).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: currentUser.id,
        title: "test: post title 0",
        content: "test: post content 0",
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
      });
    });
  });
});
