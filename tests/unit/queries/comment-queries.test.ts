import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import type { PostModel, UserModel } from "#src/generated/prisma/models.js";
import type { Comment, Comments } from "#src/types/routes/comments.js";

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
        createdAt: expect.any(Date) as Date,
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

  describe(commentQueries.getCommentsInPost, () => {
    it("should return a maximum of 10 comments on a post", async () => {
      expect.hasAssertions();

      await Promise.all(
        Array.from({ length: 11 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: comment content ${String(i)}`,
              userId: user.id,
              postId: post.id,
            },
          });
        }),
      );

      const { comments } = await commentQueries.getCommentsInPost(post.id);

      expect(comments).toHaveLength(10);
    });

    it("should return an array of comments", async () => {
      expect.hasAssertions();

      const comment = await commentQueries.createComment({
        content: "test: comment content",
        userId: user.id,
        postId: post.id,
      });

      const { comments } = await commentQueries.getCommentsInPost(post.id);

      expect(comments).toStrictEqual<Comments>([
        {
          id: comment.id,
          content: "test: comment content",
          postId: post.id,
          parentId: null,
          userId: user.id,
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
        },
      ]);
    });

    it("should not return replies as a top-level comment", async () => {
      expect.hasAssertions();

      const parentComment = await commentQueries.createComment({
        content: "test: comment content",
        userId: user.id,
        postId: post.id,
      });
      await commentQueries.createReply({
        content: "test: reply content",
        userId: user.id,
        postId: post.id,
        parentId: parentComment.id,
      });

      const { comments } = await commentQueries.getCommentsInPost(post.id);

      expect(comments).toStrictEqual<Comments>([
        {
          userId: user.id,
          postId: post.id,
          content: "test: comment content",
          createdAt: expect.any(Date) as Date,
          id: parentComment.id,
          parentId: null,
          hasReplies: true,
        },
      ]);
    });

    it("should order comments from newest to oldest", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 3 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: comment content ${String(i)}`,
              postId: post.id,
              userId: user.id,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );

      const { comments } = await commentQueries.getCommentsInPost(post.id);

      expect(comments).toStrictEqual<Comments>([
        {
          content: "test: comment content 2",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: expect.any(String) as string,
          parentId: null,
          postId: post.id,
          userId: user.id,
        },
        {
          content: "test: comment content 1",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: expect.any(String) as string,
          parentId: null,
          postId: post.id,
          userId: user.id,
        },
        {
          content: "test: comment content 0",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: expect.any(String) as string,
          parentId: null,
          postId: post.id,
          userId: user.id,
        },
      ]);
    });

    it("should return whether a comment has replies or not", async () => {
      expect.hasAssertions();

      const parentComment1 = await commentQueries.createComment({
        content: "test: parentComment1 content",
        userId: user.id,
        postId: post.id,
      });
      const parentComment2 = await commentQueries.createComment({
        content: "test: parentComment2 content",
        userId: user.id,
        postId: post.id,
      });
      await commentQueries.createReply({
        content: "test: reply content",
        parentId: parentComment1.id,
        postId: post.id,
        userId: user.id,
      });

      const { comments } = await commentQueries.getCommentsInPost(post.id);

      expect(comments).toStrictEqual<Comments>([
        {
          content: "test: parentComment2 content",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: parentComment2.id,
          parentId: null,
          postId: post.id,
          userId: user.id,
        },
        {
          content: "test: parentComment1 content",
          createdAt: expect.any(Date) as Date,
          hasReplies: true,
          id: parentComment1.id,
          parentId: null,
          postId: post.id,
          userId: user.id,
        },
      ]);
    });

    it("should return next comments after cursor comment ordered by newest to oldest", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: comment content ${String(i)}`,
              postId: post.id,
              userId: user.id,
              parentId: null,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );
      const cursorComment = await prisma.comment.findFirstOrThrow({
        where: {
          content: "test: comment content 10",
        },
      });

      const comments = await commentQueries.getCommentsInPost(
        post.id,
        cursorComment.id,
      );
      const firstComment = comments.comments[0];
      assert(firstComment);
      const lastComment = comments.comments[9];
      assert(lastComment);

      expect(firstComment.content).toBe("test: comment content 9");
      expect(lastComment.content).toBe("test: comment content 0");
    });

    it("should throw an error when cursor is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.getCommentsInPost(post.id, "non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Cursor not found."));
    });
  });
});
