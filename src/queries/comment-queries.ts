import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";
import type { CommentModel } from "#src/generated/prisma/models.js";
import type { Comment, Comments } from "#src/types/routes/comments.js";

export async function createComment({
  userId,
  postId,
  content,
}: {
  userId: string;
  postId: string;
  content: string;
}): Promise<{ id: string }> {
  try {
    const comment = await prisma.comment.create({
      data: {
        userId,
        postId,
        content,
        parentId: null,
      },
    });

    return { id: comment.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new CustomHttpStatusError(404, "Post not found.");
    }
    throw error;
  }
}

export async function getComment(id: string): Promise<Comment> {
  try {
    const comment = await prisma.comment.findUniqueOrThrow({
      where: {
        id,
      },
    });

    return comment;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CustomHttpStatusError(404, "Comment not found.");
    }
    throw error;
  }
}

export async function createReply({
  userId,
  postId,
  parentId,
  content,
}: {
  userId: string;
  postId: string;
  parentId: string;
  content: string;
}): Promise<{ id: string }> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  if (post === null) {
    throw new CustomHttpStatusError(404, "Post not found.");
  }

  const parentComment = await prisma.comment.findUnique({
    where: {
      id: parentId,
    },
  });
  if (parentComment === null) {
    throw new CustomHttpStatusError(404, "Parent comment not found.");
  }

  const createdReply = await prisma.comment.create({
    data: {
      userId,
      postId,
      parentId,
      content,
    },
  });

  return {
    id: createdReply.id,
  };
}

type GetCursorId =
  | {
      type: "comments";
      postId: string;
      nextCursor?: CommentModel | undefined;
    }
  | {
      type: "replies";
      parentCommentId: string;
      nextCursor?: CommentModel | undefined;
    };

async function nextCursorId(param: GetCursorId): Promise<string | null> {
  if (!param.nextCursor) {
    return null;
  }

  const where =
    param.type === "comments"
      ? {
          postId: param.postId,
          parentId: null,
        }
      : {
          parentId: param.parentCommentId,
        };
  const nextComment = await prisma.comment.findFirst({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: 1,
    cursor: {
      id: param.nextCursor.id,
    },
  });

  return nextComment === null ? null : param.nextCursor.id;
}

type CommentsQuery =
  | {
      type: "comments";
      postId: string;
      lastCursorId?: string;
    }
  | {
      type: "replies";
      parentCommentId: string;
      lastCursorId?: string;
    };

export async function getCommentsInPost(param: CommentsQuery): Promise<{
  comments: Comments;
  metadata: {
    nextCursorId: string | null;
  };
}> {
  if (param.type === "comments") {
    const post = await prisma.post.findUnique({
      where: {
        id: param.postId,
      },
    });
    if (post === null) {
      throw new CustomHttpStatusError(404, "Post not found.");
    }
  } else {
    const comment = await prisma.comment.findUnique({
      where: {
        id: param.parentCommentId,
      },
    });
    if (comment === null) {
      throw new CustomHttpStatusError(404, "Comment not found.");
    }
  }

  const { lastCursorId } = param;
  if (lastCursorId) {
    const cursor = await prisma.comment.findUnique({
      where: {
        id: lastCursorId,
      },
    });
    if (cursor === null) {
      throw new CustomHttpStatusError(404, "Cursor not found.");
    }
  }

  const where =
    param.type === "comments"
      ? {
          postId: param.postId,
          parentId: null,
        }
      : { parentId: param.parentCommentId };

  const comments = await prisma.comment.findMany({
    where,
    include: {
      _count: { select: { replies: true } },
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    ...(lastCursorId && { skip: 1 }),
    ...(lastCursorId && {
      cursor: {
        id: lastCursorId,
      },
    }),
  });

  const nextCursor = comments.at(-1);
  const cursorArgs: GetCursorId =
    param.type === "comments"
      ? {
          type: "comments",
          nextCursor: nextCursor,
          postId: param.postId,
        }
      : {
          type: "replies",
          nextCursor: nextCursor,
          parentCommentId: param.parentCommentId,
        };
  const nextCursorIdResult = await nextCursorId(cursorArgs);

  const result = comments.map((value) => {
    const { _count, ...comment } = value;
    return {
      ...comment,
      hasReplies: _count.replies > 0,
    };
  });
  return {
    comments: result,
    metadata: {
      nextCursorId: nextCursorIdResult,
    },
  };
}

export async function updateComment(
  commentId: string,
  content: string,
): Promise<void> {
  try {
    await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CustomHttpStatusError(404, "Comment not found.");
    }
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  try {
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CustomHttpStatusError(404, "Comment not found.");
    }
  }
}
