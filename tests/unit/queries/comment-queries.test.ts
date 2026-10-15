import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import type { PostModel, UserModel } from "#src/generated/prisma/models.js";
import type { Comment } from "#src/types/routes/comments.js";

describe("comment queries", () => {
  let user: Omit<UserModel, "password">;
  let post: PostModel;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: "test-email@test.com",
        fullName: "test: full name",
      },
    });
    post = await prisma.post.create({
      data: {
        title: "test: post title",
        content: "test: post content",
        userId: user.id,
      },
    });
  });

  describe(commentQueries.createComment, () => {
    it("should throw an error when post does not exist", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.createComment({
          userId: user.id,
          postId: "non-existing-id",
          content: "test: comment content",
        }),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Post not found."));
    });

    it("should allow user to comment on their post", async () => {
      expect.hasAssertions();

      const { id } = await commentQueries.createComment({
        userId: user.id,
        postId: post.id,
        content: "test: comment content",
      });
      const comment = await prisma.comment.findUnique({
        where: {
          id,
        },
      });

      expect(comment).not.toBeNull();
    });

    it("should allow user to comment on another user's post", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "userB-email@test.com",
          fullName: "test: userB",
        },
      });

      const { id } = await commentQueries.createComment({
        userId: userB.id,
        postId: post.id,
        content: "test: comment content",
      });
      const comment = await prisma.comment.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(comment.userId).toBe(userB.id);
    });

    it("should return created comment id", async () => {
      expect.hasAssertions();

      const { id } = await commentQueries.createComment({
        userId: user.id,
        postId: post.id,
        content: "test: comment content",
      });
      const comment = await prisma.comment.findUniqueOrThrow({
        where: {
          id,
        },
      });

      expect(comment.id).toBe(id);
    });
  });

  describe(commentQueries.getComment, () => {
    it("should throw an error when comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.getComment("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Comment not found."));
    });

    it("should return comment", async () => {
      expect.hasAssertions();

      const { id } = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: post.id,
          userId: user.id,
        },
      });

      const comment = await commentQueries.getComment(id);

      expect(comment).toStrictEqual<Comment>({
        id: id,
        content: "test: comment content",
        parentId: null,
        userId: user.id,
        postId: post.id,
      });
    });
  });

  describe(commentQueries.createReply, () => {
    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      const parentComment = await prisma.comment.create({
        data: {
          content: "test: comment content",
          postId: post.id,
          userId: user.id,
        },
      });

      await expect(
        commentQueries.createReply({
          userId: user.id,
          postId: "non-existing-id",
          parentId: parentComment.id,
          content: "test: reply content",
        }),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Post not found."));
    });

    it("should throw an error when parent comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.createReply({
          userId: user.id,
          postId: post.id,
          parentId: "non-existing-id",
          content: "test: reply content",
        }),
      ).rejects.toThrow(
        new CustomHttpStatusError(404, "Parent comment not found."),
      );
    });

    it("should allow user to reply to their comment", async () => {
      expect.hasAssertions();

      const { id: parentCommentId } = await commentQueries.createComment({
        userId: user.id,
        postId: post.id,
        content: "test: comment content",
      });

      const { id: replyId } = await commentQueries.createReply({
        userId: user.id,
        postId: post.id,
        parentId: parentCommentId,
        content: "test: reply content",
      });
      const reply = await prisma.comment.findUnique({
        where: {
          id: replyId,
        },
      });

      expect(reply).not.toBeNull();
    });

    it("should allow user to reply to another user's comment", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "userB-email@test.com",
          fullName: "test: userB",
        },
      });
      const { id: parentCommentId } = await commentQueries.createComment({
        userId: userB.id,
        postId: post.id,
        content: "test: comment content",
      });

      const { id: replyId } = await commentQueries.createReply({
        userId: userB.id,
        postId: post.id,
        parentId: parentCommentId,
        content: "test: reply content",
      });
      const reply = await prisma.comment.findUniqueOrThrow({
        where: {
          id: replyId,
        },
      });

      expect(reply.userId).toBe(userB.id);
    });
  });
});
