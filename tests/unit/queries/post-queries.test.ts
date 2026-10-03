import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { Post } from "#src/types/routes/posts.js";

describe("post queries", () => {
  describe(postQueries.createPost, () => {
    it("should create a new post", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });

      await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageUrl: null,
        imageId: null,
      });
      const post = await prisma.post.findFirst({
        where: {
          title: "test: post title",
        },
      });

      expect(post).not.toBeNull();
    });

    it("should return the created post with the author", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      const publicUser = await userQueries.getPublicUser(user.id);

      const createdPost = await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });

      expect(createdPost).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
        author: {
          id: publicUser.id,
          fullName: "test: full name",
          isOnline: true,
          lastSeen: publicUser.lastSeen,
          picture: null,
        },
      });
    });
  });

  describe(postQueries.getPost, () => {
    it("throw an error when the post is not found", async () => {
      expect.hasAssertions();

      await expect(postQueries.getPost("non-existing-id")).rejects.toThrow(
        new CustomHttpStatusError(404, "Post not found."),
      );
    });

    it("should return the requested post with the author", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      const publicUser = await userQueries.getPublicUser(user.id);
      const createdPost = await prisma.post.create({
        data: {
          userId: user.id,
          content: "test-post-content",
          title: "test-post-title",
        },
      });

      const post = await postQueries.getPost(createdPost.id);

      expect(post).toStrictEqual<Post>({ ...createdPost, author: publicUser });
    });
  });
});
