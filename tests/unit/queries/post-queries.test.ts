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

      expect(result.posts).toStrictEqual<Post[]>([post2, post1]);
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

      expect(result.posts).toStrictEqual<Post[]>([userBPost, userAPost]);
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

      expect(result.posts).toHaveLength(10);
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

      expect(result.posts).toHaveLength(4);
      expect(result.posts[0]?.title).toBe("test: post title 3");
      expect(result.posts[3]?.title).toBe("test: post title 0");
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

      expect(result.posts).toHaveLength(10);
      expect(result.posts[0]?.title).toBe("test: post title 23");
      expect(result.posts[9]?.title).toBe("test: post title 14");
    });

    it("should throw an error when cursor is not found", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });

      await expect(
        postQueries.getIndexPosts(user.id, "non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Cursor not found."));
    });

    it("should return the next cursor id when there are remaining posts to be fetched", async () => {
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
      const firstResult = await postQueries.getIndexPosts(user.id);
      assert(firstResult.metadata.nextCursorId);
      const secondResult = await postQueries.getIndexPosts(
        user.id,
        firstResult.metadata.nextCursorId,
      );
      assert(secondResult.metadata.nextCursorId);

      const firstCursor = firstResult.posts[9];
      const secondCursor = secondResult.posts[9];
      assert(firstCursor);
      assert(secondCursor);

      expect(firstResult.metadata.nextCursorId).toBe(firstCursor.id);
      expect(secondResult.metadata.nextCursorId).toBe(secondCursor.id);
    });

    it("should return the next cursor id as null when there are no remaining posts to be fetched", async () => {
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
      const firstResult = await postQueries.getIndexPosts(user.id);
      assert(firstResult.metadata.nextCursorId);
      const secondResult = await postQueries.getIndexPosts(
        user.id,
        firstResult.metadata.nextCursorId,
      );
      assert(secondResult.metadata.nextCursorId);
      const thirdResult = await postQueries.getIndexPosts(
        user.id,
        secondResult.metadata.nextCursorId,
      );

      expect(thirdResult.metadata.nextCursorId).toBeNull();
    });

    it("should return hasNextPage as true when there are remaining posts to fetch", async () => {
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
      const firstResult = await postQueries.getIndexPosts(user.id);
      assert(firstResult.metadata.nextCursorId);
      const secondResult = await postQueries.getIndexPosts(
        user.id,
        firstResult.metadata.nextCursorId,
      );
      assert(secondResult.metadata.nextCursorId);

      const firstCursor = firstResult.posts[9];
      const secondCursor = secondResult.posts[9];
      assert(firstCursor);
      assert(secondCursor);

      expect(firstResult.metadata.hasNextPage).toBe(true);
      expect(secondResult.metadata.hasNextPage).toBe(true);
    });

    it("should return hasNextPage as false when there are no remaining posts to fetch", async () => {
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
      const firstResult = await postQueries.getIndexPosts(user.id);
      assert(firstResult.metadata.nextCursorId);
      const secondResult = await postQueries.getIndexPosts(
        user.id,
        firstResult.metadata.nextCursorId,
      );
      assert(secondResult.metadata.nextCursorId);
      const thirdResult = await postQueries.getIndexPosts(
        user.id,
        secondResult.metadata.nextCursorId,
      );

      expect(thirdResult.metadata.hasNextPage).toBe(false);
    });

    it("should return 10 posts after the cursor", async () => {
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

      const firstResult = await postQueries.getIndexPosts(user.id);
      assert(firstResult.metadata.nextCursorId);
      const secondResult = await postQueries.getIndexPosts(
        user.id,
        firstResult.metadata.nextCursorId,
      );
      assert(secondResult.metadata.nextCursorId);
      const thirdResult = await postQueries.getIndexPosts(
        user.id,
        secondResult.metadata.nextCursorId,
      );

      expect(firstResult.posts).toHaveLength(10);
      expect(secondResult.posts).toHaveLength(10);
      expect(thirdResult.posts).toHaveLength(4);
    });

    it("should skip the cursor in subsequent calls", async () => {
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
      const firstResult = await postQueries.getIndexPosts(user.id);
      assert(firstResult.metadata.nextCursorId);
      const secondResult = await postQueries.getIndexPosts(
        user.id,
        firstResult.metadata.nextCursorId,
      );
      assert(secondResult.metadata.nextCursorId);
      const thirdResult = await postQueries.getIndexPosts(
        user.id,
        secondResult.metadata.nextCursorId,
      );

      const firstCursor = firstResult.posts[9];
      const secondCursor = secondResult.posts[9];
      assert(firstCursor);
      assert(secondCursor);

      expect(secondResult.posts).not.toContainEqual(firstCursor);
      expect(thirdResult.posts).not.toContainEqual(secondCursor);
      expect(thirdResult.posts).toHaveLength(4);
    });
  });

  describe(postQueries.updatePost, () => {
    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });

      await expect(
        postQueries.updatePost(user.id, "non-existing-id", {}),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "No post found to update."),
      );
    });

    it("should update post with specified fields", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      const createdPost = await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageId: null,
        imageUrl: null,
      });

      await postQueries.updatePost(user.id, createdPost.id, {
        title: "test: updated post title",
        content: "test: updated post content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
      const { author: _, ...updatedPost } = await postQueries.getPost(
        createdPost.id,
      );

      expect(updatedPost).toStrictEqual<Omit<Post, "author">>({
        id: createdPost.id,
        userId: user.id,
        title: "test: updated post title",
        content: "test: updated post content",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
        createdAt: createdPost.createdAt,
      });
    });

    it("should leave unspecified fields as is", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      const createdPost = await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageId: null,
        imageUrl: null,
      });

      await postQueries.updatePost(user.id, createdPost.id, {
        content: "test: updated post content",
      });
      const { author: _, ...updatedPost } = await postQueries.getPost(
        createdPost.id,
      );

      expect(updatedPost).toStrictEqual<Omit<Post, "author">>({
        id: createdPost.id,
        userId: user.id,
        title: "test: post title",
        content: "test: updated post content",
        imageUrl: null,
        imageId: null,
        createdAt: createdPost.createdAt,
      });
    });

    it("should throw an error when another user tries to update the post", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "test-userA@email.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const userB = await userQueries.createUserLocal({
        email: "test-userB@email.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const post = await postQueries.createPost({
        userId: userA.id,
        title: "test: userA post title",
        content: "test: userA post content",
        imageId: null,
        imageUrl: null,
      });

      await expect(
        postQueries.updatePost(userB.id, post.id, {}),
      ).rejects.toThrow(
        new CustomHttpStatusError(
          403,
          "You do not have permission to update this post.",
        ),
      );
    });
  });

  describe(postQueries.deletePost, () => {
    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });

      await expect(
        postQueries.deletePost(user.id, "non-existing-id"),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "No post found to delete."),
      );
    });

    it("should delete post", async () => {
      expect.hasAssertions();

      const user = await userQueries.createUserLocal({
        email: "test-email@test.com",
        fullName: "test: full name",
        password: "test-user-password",
      });
      const createdPost = await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageId: null,
        imageUrl: null,
      });

      await postQueries.deletePost(user.id, createdPost.id);
      const deletedPost = await prisma.post.findUnique({
        where: {
          id: createdPost.id,
        },
      });

      expect(deletedPost).toBeNull();
    });

    it("should throw an error when another user tries to delete the post", async () => {
      expect.hasAssertions();

      const userA = await userQueries.createUserLocal({
        email: "test-userA@email.com",
        fullName: "test: userA",
        password: "test-userA-password",
      });
      const userB = await userQueries.createUserLocal({
        email: "test-userB@email.com",
        fullName: "test: userB",
        password: "test-userB-password",
      });
      const post = await postQueries.createPost({
        userId: userA.id,
        title: "test: userA post title",
        content: "test: userA post content",
        imageId: null,
        imageUrl: null,
      });

      await expect(postQueries.deletePost(userB.id, post.id)).rejects.toThrow(
        new CustomHttpStatusError(
          403,
          "You do not have permission to delete this post.",
        ),
      );
    });
  });
});
