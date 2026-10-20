import prisma from "#src/db/prisma-client.js";
import * as likeQueries from "#src/queries/like-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type {
  CommentModel,
  PostModel,
  UserModel,
} from "#src/generated/prisma/models.js";

describe("like queries", () => {
  let currentUser: Omit<UserModel, "password">;
  let post: PostModel;
  let comment: CommentModel;

  beforeEach(async () => {
    currentUser = await prisma.user.create({
      data: {
        email: "test-email@test.com",
        fullName: "test: full name",
      },
    });
    post = await prisma.post.create({
      data: {
        title: "test: post title",
        content: "test: post content",
        userId: currentUser.id,
      },
    });
    comment = await prisma.comment.create({
      data: {
        content: "test: comment content",
        userId: currentUser.id,
        postId: post.id,
      },
    });
  });

  describe(likeQueries.createPostLike, () => {
    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      await expect(
        likeQueries.createPostLike(currentUser.id, "non-existing-id"),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "No post found to like."),
      );
    });

    it("should throw an error when the same user tries to like a post twice", async () => {
      expect.hasAssertions();

      await likeQueries.createPostLike(currentUser.id, post.id);

      await expect(
        likeQueries.createPostLike(currentUser.id, post.id),
      ).rejects.toThrow(
        new CustomHttpStatusError(409, "You can’t like post twice."),
      );
    });

    it("should like post", async () => {
      expect.hasAssertions();

      await likeQueries.createPostLike(currentUser.id, post.id);
      const likes = await prisma.like.count({
        where: {
          postId: post.id,
        },
      });

      expect(likes).toBe(1);
    });
  });

  describe(likeQueries.getPostLikes, () => {
    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      await expect(likeQueries.getPostLikes("non-existing-id")).rejects.toThrow(
        new CustomHttpStatusError(404, "Post not found."),
      );
    });

    it("should return number of post likes", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });

      await likeQueries.createPostLike(currentUser.id, post.id);
      await likeQueries.createPostLike(userB.id, post.id);

      const postLikes = await likeQueries.getPostLikes(post.id);

      expect(postLikes).toBe(2);
    });
  });

  describe(likeQueries.deletePostLike, () => {
    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      await expect(
        likeQueries.deletePostLike(currentUser.id, "non-existing-id"),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "No post found to unlike."),
      );
    });

    it("should throw an error when no like is found", async () => {
      expect.hasAssertions();

      await expect(
        likeQueries.deletePostLike(currentUser.id, post.id),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "No like found to delete."),
      );
    });

    it("should unlike post", async () => {
      expect.hasAssertions();

      await likeQueries.createPostLike(currentUser.id, post.id);

      await likeQueries.deletePostLike(currentUser.id, post.id);
      const postLikes = await likeQueries.getPostLikes(post.id);

      expect(postLikes).toBe(0);
    });
  });

  describe(likeQueries.createCommentLike, () => {
    it("should throw an error when comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        likeQueries.createCommentLike(currentUser.id, "non-existing-id"),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "No comment found to like."),
      );
    });

    it("should throw an error when comment is already liked", async () => {
      expect.hasAssertions();

      await likeQueries.createCommentLike(currentUser.id, comment.id);

      await expect(
        likeQueries.createCommentLike(currentUser.id, comment.id),
      ).rejects.toThrow(
        new CustomHttpStatusError(409, "You can’t like comment twice."),
      );
    });

    it("should like comment", async () => {
      expect.hasAssertions();

      await likeQueries.createCommentLike(currentUser.id, comment.id);
      const commentLikes = await prisma.like.count({
        where: {
          commentId: comment.id,
        },
      });

      expect(commentLikes).toBe(1);
    });
  });

  describe(likeQueries.getCommentLikes, () => {
    it("should throw an error when comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        likeQueries.getCommentLikes("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Comment not found."));
    });

    it("should return number of comment likes", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
        },
      });

      await likeQueries.createCommentLike(currentUser.id, comment.id);
      await likeQueries.createCommentLike(userB.id, comment.id);
      const commentLikes = await likeQueries.getCommentLikes(comment.id);

      expect(commentLikes).toBe(2);
    });
  });

  describe(likeQueries.deleteCommentLike, () => {
    it.todo("should throw an error when comment is not found");
  });
});
