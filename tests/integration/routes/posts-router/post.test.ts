import express from "express";
import request from "supertest";
import indexRouter from "#src/routes/index-router.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as postQueries from "#src/queries/post-queries.js";
import issueJwt from "#src/utils/issue-jwt.js";
import prisma from "#src/db/prisma-client.js";
import deleteUpload from "#src/services/delete-upload.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import uploadImage from "#src/services/upload-image.js";
import type { User } from "#src/types/routes/users.js";
import type {
  GetPostResponseBody,
  Post,
  UpdatePostRequestBody,
} from "#src/types/routes/posts.js";
import type { ClientError } from "#src/types/errors/errors.js";

vi.mock(import("#src/services/delete-upload.js"));
vi.mock(import("#src/services/upload-image.js"));

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

  afterEach(() => {
    vi.resetAllMocks();
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

  describe("update post PATCH", () => {
    it("should return 400 status with error message when given invalid inputs", async () => {
      expect.hasAssertions();

      const requestBody: UpdatePostRequestBody = {
        title: "1".repeat(256),
        content: "",
      };

      const response = await request(app)
        .patch(`/posts/${post.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [
          { message: "Post title cannot exceed 255 characters." },
          { message: "Post title cannot be empty." },
        ],
      });
    });

    it("should return 404 status with error message when post does not exist", async () => {
      expect.hasAssertions();

      const requestBody: UpdatePostRequestBody = {};

      const response = await request(app)
        .patch("/posts/non-existing-id")
        .auth(currentUserToken, { type: "bearer" })
        .send(requestBody)
        .expect("Content-type", /json/)
        .expect(404);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "No post found to update." }],
      });
    });

    it("should return 204 status when given valid inputs", async () => {
      expect.hasAssertions();

      const requestBody: UpdatePostRequestBody = {
        title: "test: updated post title",
        content: "test: updated post content",
      };

      await request(app)
        .patch(`/posts/${post.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .send(requestBody)
        .expect(204);
      const updatedPost = await prisma.post.findUnique({
        where: {
          id: post.id,
        },
      });
      assert(updatedPost);

      expect(updatedPost.title).toBe(requestBody.title);
      expect(updatedPost.content).toBe(requestBody.content);
    });

    it("should return 400 status with error message when image is larger than 5MiB", async () => {
      expect.hasAssertions();

      const buffer = Buffer.alloc(5 * 2 ** 20 + 1);

      const response = await request(app)
        .patch(`/posts/${post.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .attach("postImage", buffer, {
          filename: "test-filename",
          contentType: "image/png",
        })
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "File cannot exceed 5MiB." }],
      });
    });

    it("should return 400 status with error message when file is not of type image", async () => {
      expect.hasAssertions();

      const buffer = Buffer.alloc(1024);

      const response = await request(app)
        .patch(`/posts/${post.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .attach("postImage", buffer, {
          filename: "test-filename",
          contentType: "text/plain",
        })
        .expect("Content-type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "File must be of type image." }],
      });
    });

    it("should return 502 status with error message when deleting uploaded image fails", async () => {
      expect.hasAssertions();

      const postWithImage = await postQueries.createPost({
        userId: currentUser.id,
        title: "test: post title",
        content: "test: post content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
      const buffer = Buffer.alloc(1024);
      vi.mocked(deleteUpload).mockRejectedValue(
        new CustomHttpStatusError(502, "Failed to delete upload."),
      );

      const response = await request(app)
        .patch(`/posts/${postWithImage.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .attach("postImage", buffer, {
          filename: "test-filename",
          contentType: "image/png",
        })
        .expect("Content-type", /json/)
        .expect(502);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Failed to delete upload." }],
      });
    });

    it("should return 502 status with error message when uploading image fails", async () => {
      expect.hasAssertions();

      const postWithImage = await postQueries.createPost({
        userId: currentUser.id,
        title: "test: post title",
        content: "test: post content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
      const buffer = Buffer.alloc(1024);
      vi.mocked(uploadImage).mockRejectedValue(
        new CustomHttpStatusError(502, "Failed to upload file."),
      );

      const response = await request(app)
        .patch(`/posts/${postWithImage.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .attach("postImage", buffer, {
          filename: "test-filename",
          contentType: "image/png",
        })
        .expect("Content-type", /json/)
        .expect(502);

      expect(response.body).toStrictEqual<ClientError>({
        errors: [{ message: "Failed to upload file." }],
      });
    });

    it("should return 204 status when upload is successful", async () => {
      expect.hasAssertions();

      const postWithImage = await postQueries.createPost({
        userId: currentUser.id,
        title: "test: post title",
        content: "test: post content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
      const buffer = Buffer.alloc(1024);
      vi.mocked(uploadImage).mockResolvedValue({
        imageUrl: "test-updated-image-url",
        imageId: "test-updated-image-id",
      });

      await request(app)
        .patch(`/posts/${postWithImage.id}`)
        .auth(currentUserToken, { type: "bearer" })
        .attach("postImage", buffer, {
          filename: "test-filename",
          contentType: "image/png",
        })
        .expect(204);
      const updatedPost = await prisma.post.findUniqueOrThrow({
        where: {
          id: postWithImage.id,
        },
      });

      expect(updatedPost.imageUrl).toBe("test-updated-image-url");
      expect(updatedPost.imageId).toBe("test-updated-image-id");
    });
  });
});
