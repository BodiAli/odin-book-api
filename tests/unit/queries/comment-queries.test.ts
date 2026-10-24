import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";
import * as likeQueries from "#src/queries/like-queries.js";
import type { PostModel, UserModel } from "#src/generated/prisma/models.js";
import type { Comments } from "#src/types/routes/comments.js";

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

      const { comments } = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });

      expect(comments).toHaveLength(10);
    });

    it("should return an array of comments", async () => {
      expect.hasAssertions();

      const comment = await commentQueries.createComment({
        content: "test: comment content",
        userId: user.id,
        postId: post.id,
      });

      const { comments } = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });

      expect(comments).toStrictEqual<Comments>([
        {
          id: comment.id,
          content: "test: comment content",
          postId: post.id,
          parentId: null,
          userId: user.id,
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          isLiked: false,
          likes: 0,
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

      const { comments } = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });

      expect(comments).toStrictEqual<Comments>([
        {
          userId: user.id,
          postId: post.id,
          content: "test: comment content",
          createdAt: expect.any(Date) as Date,
          id: parentComment.id,
          parentId: null,
          hasReplies: true,
          isLiked: false,
          likes: 0,
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

      const { comments } = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });

      expect(comments).toStrictEqual<Comments>([
        {
          content: "test: comment content 2",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: expect.any(String) as string,
          parentId: null,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
        },
        {
          content: "test: comment content 1",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: expect.any(String) as string,
          parentId: null,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
        },
        {
          content: "test: comment content 0",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: expect.any(String) as string,
          parentId: null,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
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

      const { comments } = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });

      expect(comments).toStrictEqual<Comments>([
        {
          content: "test: parentComment2 content",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: parentComment2.id,
          parentId: null,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
        },
        {
          content: "test: parentComment1 content",
          createdAt: expect.any(Date) as Date,
          hasReplies: true,
          id: parentComment1.id,
          parentId: null,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
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

      const comments = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        lastCursorId: cursorComment.id,
        userId: user.id,
      });
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
        commentQueries.getCommentsInPost({
          type: "comments",
          postId: post.id,
          lastCursorId: "non-existing-id",
          userId: user.id,
        }),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Cursor not found."));
    });

    it("should return nextCursorId as null when there are no more comments to fetch", async () => {
      expect.hasAssertions();

      await commentQueries.createComment({
        content: "test: comment content",
        userId: user.id,
        postId: post.id,
      });

      const comments = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });

      expect(comments.metadata.nextCursorId).toBeNull();
    });

    it("should return nextCursorId pointing to the next cursor comment when there are more comments to fetch", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 11 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: comment content ${String(i)}`,
              userId: user.id,
              postId: post.id,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );

      const comments = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        userId: user.id,
      });
      const nextCursorComment = await prisma.comment.findFirstOrThrow({
        where: {
          content: "test: comment content 1",
        },
      });

      expect(comments.metadata.nextCursorId).toBe(nextCursorComment.id);
    });

    it("should return nextCursorId as null when there are no more comments to fetch while next cursor is passed", async () => {
      expect.hasAssertions();

      await commentQueries.createComment({
        content: "test: comment content 1",
        userId: user.id,
        postId: post.id,
      });
      const lastCursor = await commentQueries.createComment({
        content: "test: comment content 2",
        userId: user.id,
        postId: post.id,
      });
      await commentQueries.createComment({
        content: "test: comment content 3",
        userId: user.id,
        postId: post.id,
      });

      const comments = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        lastCursorId: lastCursor.id,
        userId: user.id,
      });

      expect(comments.metadata.nextCursorId).toBeNull();
    });

    it("should return nextCursorId pointing to the next cursor comment when there are more comments to fetch while next cursor is passed", async () => {
      expect.hasAssertions();

      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: comment content ${String(i)}`,
              userId: user.id,
              postId: post.id,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );
      const lastCursor = await prisma.comment.findFirstOrThrow({
        where: {
          content: "test: comment content 11",
        },
      });

      const comments = await commentQueries.getCommentsInPost({
        type: "comments",
        postId: post.id,
        lastCursorId: lastCursor.id,
        userId: user.id,
      });
      const nextCursorComment = await prisma.comment.findFirstOrThrow({
        where: {
          content: "test: comment content 1",
        },
      });

      expect(comments.metadata.nextCursorId).toBe(nextCursorComment.id);
    });

    it("should return comment replies when type is 'replies'", async () => {
      expect.hasAssertions();

      const parentComment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });
      const parentReply1 = await commentQueries.createReply({
        content: "test: parentReply1 content",
        parentId: parentComment.id,
        userId: user.id,
        postId: post.id,
      });
      const parentReply2 = await commentQueries.createReply({
        content: "test: parentReply2 content",
        parentId: parentComment.id,
        userId: user.id,
        postId: post.id,
      });
      await commentQueries.createReply({
        content: "test: childReply content",
        parentId: parentReply1.id,
        userId: user.id,
        postId: post.id,
      });

      const { comments: replies } = await commentQueries.getCommentsInPost({
        type: "replies",
        parentCommentId: parentComment.id,
        userId: user.id,
      });

      expect(replies).toStrictEqual<Comments>([
        {
          content: "test: parentReply2 content",
          createdAt: expect.any(Date) as Date,
          hasReplies: false,
          id: parentReply2.id,
          parentId: parentComment.id,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
        },
        {
          content: "test: parentReply1 content",
          createdAt: expect.any(Date) as Date,
          hasReplies: true,
          id: parentReply1.id,
          parentId: parentComment.id,
          postId: post.id,
          userId: user.id,
          isLiked: false,
          likes: 0,
        },
      ]);
    });

    it("should return nextCursorId as null when there are no more replies to fetch", async () => {
      expect.hasAssertions();

      const parentComment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });
      await commentQueries.createReply({
        content: "test: reply content",
        parentId: parentComment.id,
        userId: user.id,
        postId: post.id,
      });

      const { metadata } = await commentQueries.getCommentsInPost({
        type: "replies",
        parentCommentId: parentComment.id,
        userId: user.id,
      });

      expect(metadata.nextCursorId).toBeNull();
    });

    it("should return nextCursorId pointing to next reply cursor when there are more replies to fetch", async () => {
      expect.hasAssertions();

      const parentComment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });
      const baseDate = new Date("2020-01-01T00:00:00Z");
      await Promise.all(
        Array.from({ length: 11 }, (_, i) => {
          return prisma.comment.create({
            data: {
              content: `test: reply content ${String(i)}`,
              parentId: parentComment.id,
              userId: user.id,
              postId: post.id,
              createdAt: new Date(baseDate.getTime() + i),
            },
          });
        }),
      );

      const { metadata } = await commentQueries.getCommentsInPost({
        type: "replies",
        parentCommentId: parentComment.id,
        userId: user.id,
      });
      const cursor = await prisma.comment.findFirstOrThrow({
        where: {
          content: "test: reply content 1",
        },
      });

      expect(metadata.nextCursorId).toBe(cursor.id);
    });

    it("should throw an error when post is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.getCommentsInPost({
          type: "comments",
          postId: "non-existing-id",
          userId: user.id,
        }),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Post not found."));
    });

    it("should throw an error when comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.getCommentsInPost({
          type: "replies",
          parentCommentId: "non-existing-id",
          userId: user.id,
        }),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Comment not found."));
    });

    it("should return number of comment likes", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
          password: "test-userB",
        },
      });
      const comment1 = await prisma.comment.create({
        data: {
          content: "test: comment1 content",
          userId: user.id,
          postId: post.id,
        },
      });
      await prisma.comment.create({
        data: {
          content: "test: comment2 content",
          userId: user.id,
          postId: post.id,
        },
      });
      await likeQueries.createCommentLike(user.id, comment1.id);
      await likeQueries.createCommentLike(userB.id, comment1.id);

      const { comments } = await commentQueries.getCommentsInPost({
        userId: user.id,
        type: "comments",
        postId: post.id,
      });
      assert(comments[0]);
      assert(comments[1]);

      expect(comments).toHaveLength(2);
      expect(comments[0].likes).toBe(0);
      expect(comments[1].likes).toBe(2);
    });

    it("should return whether a comment is liked or not", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
          password: "test-userB",
        },
      });
      const comment1 = await prisma.comment.create({
        data: {
          content: "test: comment1 content",
          userId: user.id,
          postId: post.id,
        },
      });
      const comment2 = await prisma.comment.create({
        data: {
          content: "test: comment2 content",
          userId: user.id,
          postId: post.id,
        },
      });
      await likeQueries.createCommentLike(user.id, comment1.id);
      await likeQueries.createCommentLike(userB.id, comment1.id);
      await likeQueries.createCommentLike(userB.id, comment2.id);

      const { comments } = await commentQueries.getCommentsInPost({
        userId: user.id,
        type: "comments",
        postId: post.id,
      });
      assert(comments[0]);
      assert(comments[1]);

      expect(comments).toHaveLength(2);
      expect(comments[0].isLiked).toBe(false);
      expect(comments[1].isLiked).toBe(true);
    });

    it("should return number of reply likes", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
          password: "test-userB",
        },
      });
      const parentComment = await prisma.comment.create({
        data: {
          content: "test: parentComment content",
          userId: user.id,
          postId: post.id,
        },
      });
      const reply1 = await prisma.comment.create({
        data: {
          content: "test: reply1 content",
          userId: user.id,
          postId: post.id,
          parentId: parentComment.id,
        },
      });
      await prisma.comment.create({
        data: {
          content: "test: reply2 content",
          userId: user.id,
          postId: post.id,
          parentId: parentComment.id,
        },
      });
      await likeQueries.createCommentLike(user.id, reply1.id);
      await likeQueries.createCommentLike(userB.id, reply1.id);

      const { comments } = await commentQueries.getCommentsInPost({
        userId: user.id,
        type: "replies",
        parentCommentId: parentComment.id,
      });
      assert(comments[0]);
      assert(comments[1]);

      expect(comments).toHaveLength(2);
      expect(comments[0].likes).toBe(0);
      expect(comments[1].likes).toBe(2);
    });

    it("should return whether a reply is liked or not", async () => {
      expect.hasAssertions();

      const userB = await prisma.user.create({
        data: {
          email: "test-userB@test.com",
          fullName: "test: userB",
          password: "test-userB",
        },
      });
      const parentComment = await prisma.comment.create({
        data: {
          content: "test: parentComment content",
          userId: user.id,
          postId: post.id,
        },
      });
      const reply1 = await prisma.comment.create({
        data: {
          content: "test: reply1 content",
          userId: user.id,
          postId: post.id,
          parentId: parentComment.id,
        },
      });
      const reply2 = await prisma.comment.create({
        data: {
          content: "test: reply2 content",
          userId: user.id,
          postId: post.id,
          parentId: parentComment.id,
        },
      });
      await likeQueries.createCommentLike(user.id, reply1.id);
      await likeQueries.createCommentLike(userB.id, reply1.id);
      await likeQueries.createCommentLike(userB.id, reply2.id);

      const { comments } = await commentQueries.getCommentsInPost({
        userId: user.id,
        type: "replies",
        parentCommentId: parentComment.id,
      });
      assert(comments[0]);
      assert(comments[1]);

      expect(comments).toHaveLength(2);
      expect(comments[0].isLiked).toBe(false);
      expect(comments[1].isLiked).toBe(true);
    });
  });

  describe(commentQueries.updateComment, () => {
    it("should throw error when comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.updateComment(
          "non-existing-id",
          "test: updated content",
        ),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Comment not found."));
    });

    it("should update comment", async () => {
      expect.hasAssertions();

      const comment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });

      await commentQueries.updateComment(comment.id, "test: updated comment");
      const updatedComment = await prisma.comment.findUniqueOrThrow({
        where: {
          id: comment.id,
        },
      });

      expect(updatedComment.content).toBe("test: updated comment");
    });
  });

  describe(commentQueries.deleteComment, () => {
    it("should throw error when comment is not found", async () => {
      expect.hasAssertions();

      await expect(
        commentQueries.deleteComment("non-existing-id"),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Comment not found."));
    });

    it("should delete comment", async () => {
      expect.hasAssertions();

      const comment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });

      await commentQueries.deleteComment(comment.id);
      const deletedComment = await prisma.comment.findUnique({
        where: {
          id: comment.id,
        },
      });

      expect(deletedComment).toBeNull();
    });
  });

  describe(commentQueries.getCommentAuthorId, () => {
    it("should return comment author id", async () => {
      expect.hasAssertions();

      const comment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });

      const commentAuthorId = await commentQueries.getCommentAuthorId(
        comment.id,
      );

      expect(commentAuthorId).toBe(user.id);
    });

    it("should return reply author id", async () => {
      expect.hasAssertions();

      const comment = await commentQueries.createComment({
        content: "test: comment content",
        postId: post.id,
        userId: user.id,
      });
      const reply = await commentQueries.createReply({
        content: "test: reply content",
        postId: post.id,
        userId: user.id,
        parentId: comment.id,
      });

      const replyAuthorId = await commentQueries.getCommentAuthorId(reply.id);

      expect(replyAuthorId).toBe(user.id);
    });
  });
});
