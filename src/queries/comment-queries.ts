import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";
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

export async function getComments(
  userId: string,
  postId: string,
): Promise<Comments> {}
