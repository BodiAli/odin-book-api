import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as postQueries from "#src/queries/post-queries.js";
import * as userQueries from "#src/queries/user-queries.js";
import * as userFollowsQueries from "#src/queries/user-follows-queries.js";
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
        createdAt: expect.any(Date) as Date,
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

  describe(postQueries.getIndexPosts, () => {
    it("should return posts created by current user while sorted by creation date", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      const post1 = await postQueries.createPost({
        userId: user.id,
        title: "test: post1 title",
        content: "test: post1 content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
      const post2 = await postQueries.createPost({
        userId: user.id,
        title: "test: post2 title",
        content: "test: post2 content",
        imageUrl: null,
        imageId: null,
      });

      const result = await postQueries.getIndexPosts(user.id);

      expect(result).toStrictEqual<Post[]>([post2, post1]);
    });

    it("should return posts created by users the current user follows while sorted by creation date", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "test-userA@test.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const userB = await userQueries.createUserLocal({
        email: "test-userB@test.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const userC = await userQueries.createUserLocal({
        email: "test-userC@test.com",
        fullName: "test: userC",
        password: "test-userC-password",
      });
      const currentUser = await userQueries.createUserLocal({
        email: "test-currentUser@test.com",
        fullName: "test: currentUser",
        password: "test-currentUser-password",
      });
      await userFollowsQueries.followUser(currentUser.id, userA.id);
      await userFollowsQueries.followUser(currentUser.id, userB.id);
      const userAPost = await postQueries.createPost({
        userId: userA.id,
        title: "test: userA post title",
        content: "test: userA post content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
      const userBPost = await postQueries.createPost({
        userId: userB.id,
        title: "test: userB post title",
        content: "test: userB post content",
        imageUrl: null,
        imageId: null,
      });
      await postQueries.createPost({
        userId: userC.id,
        title: "test: userC post title",
        content: "test: userC post content",
        imageUrl: null,
        imageId: null,
      });

      const result = await postQueries.getIndexPosts(currentUser.id);

      expect(result).toStrictEqual<Post[]>([userBPost, userAPost]);
    });

    it("should return only 10 posts", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      await Promise.all(
        Array.from({ length: 11 }, (_, i) => {
          return postQueries.createPost({
            userId: user.id,
            title: `test: post title ${String(i)}`,
            content: `test: post content ${String(i)}`,
            imageId: null,
            imageUrl: null,
          });
        }),
      );

      const result = await postQueries.getIndexPosts(user.id);

      expect(result).toHaveLength(10);
    });

    it("should return the next (n<=10) posts after the given cursor", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2026-01-01T00:00:00.000Z");
      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      await Promise.all(
        Array.from({ length: 24 }, (_, i) => {
          return prisma.post.create({
            data: {
              userId: user.id,
              title: `test: post title ${String(i)}`,
              content: `test: post content ${String(i)}`,
              imageId: null,
              imageUrl: null,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );
      const cursorPost = await prisma.post.findFirstOrThrow({
        where: {
          title: "test: post title 4",
        },
      });

      const result = await postQueries.getIndexPosts(user.id, cursorPost.id);

      expect(result).toHaveLength(4);
      expect(result[0]?.title).toBe("test: post title 3");
      expect(result[3]?.title).toBe("test: post title 0");
    });

    it("should return the newest 10 posts when cursor is not passed", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2026-01-01T00:00:00.000Z");
      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      await Promise.all(
        Array.from({ length: 24 }, (_, i) => {
          return prisma.post.create({
            data: {
              userId: user.id,
              title: `test: post title ${String(i)}`,
              content: `test: post content ${String(i)}`,
              imageId: null,
              imageUrl: null,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );

      const result = await postQueries.getIndexPosts(user.id);

      expect(result).toHaveLength(10);
      expect(result[0]?.title).toBe("test: post title 23");
      expect(result[9]?.title).toBe("test: post title 14");
    });
  });
});
