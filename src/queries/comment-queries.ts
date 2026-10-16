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

async function nextCursorId(
  postId: string,
  nextComment: CommentModel | undefined,
): Promise<string | null> {
  if (!nextComment) {
    return null;
  }

  const comment = await prisma.comment.findFirst({
    where: {
      postId,
      parentId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: 1,
    cursor: {
      id: nextComment.id,
    },
  });

  return comment === null ? null : nextComment.id;
}

export async function getCommentsInPost(
  postId: string,
  lastCursorId?: string,
): Promise<{
  comments: Comments;
  metadata: {
    nextCursorId: string | null;
  };
}> {
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

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null,
    },
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

  const nextComment = comments.at(-1);
  const nextCursorIdResult = await nextCursorId(postId, nextComment);

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
