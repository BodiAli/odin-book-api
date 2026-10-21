import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";

export async function createPostLike(
  userId: string,
  postId: string,
): Promise<void> {
  try {
    await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new CustomHttpStatusError(404, "No post found to like.");
      }

      if (error.code === "P2002") {
        throw new CustomHttpStatusError(409, "You can’t like post twice.");
      }
    }
    throw error;
  }
}

export async function getPostLikes(postId: string): Promise<number> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  if (post === null) {
    throw new CustomHttpStatusError(404, "Post not found.");
  }

  const numberOfPostLikes = await prisma.like.count({
    where: {
      postId,
    },
  });

  return numberOfPostLikes;
}

export async function deletePostLike(
  userId: string,
  postId: string,
): Promise<void> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  if (post === null) {
    throw new CustomHttpStatusError(404, "No post found to unlike.");
  }
  const like = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
  if (like === null) {
    throw new CustomHttpStatusError(404, "No like found to delete.");
  }

  await prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
}

export async function createCommentLike(
  userId: string,
  commentId: string,
): Promise<void> {
  try {
    await prisma.like.create({
      data: {
        userId,
        commentId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new CustomHttpStatusError(404, "No comment found to like.");
      }
      if (error.code === "P2002") {
        throw new CustomHttpStatusError(409, "You can’t like comment twice.");
      }
    }
    throw error;
  }
}

export async function getCommentLikes(commentId: string): Promise<number> {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });
  if (comment === null) {
    throw new CustomHttpStatusError(404, "Comment not found.");
  }
  const commentLikes = await prisma.like.count({
    where: {
      commentId,
    },
  });

  return commentLikes;
}

export async function deleteCommentLike(
  userId: string,
  commentId: string,
): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });
  if (comment === null) {
    throw new CustomHttpStatusError(404, "No comment found to unlike.");
  }

  const like = await prisma.like.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });
  if (like === null) {
    throw new CustomHttpStatusError(404, "No like found to delete.");
  }

  await prisma.like.delete({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });
}

export async function isPostLikedByCurrentUser(
  userId: string,
  postId: string,
): Promise<boolean> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  if (post === null) {
    throw new CustomHttpStatusError(404, "Post not found.");
  }

  const like = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  return Boolean(like);
}

export async function isCommentLikedByCurrentUser(
  userId: string,
  commentId: string,
): Promise<boolean> {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });
  if (comment === null) {
    throw new CustomHttpStatusError(404, "Comment not found.");
  }

  const like = await prisma.like.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  return Boolean(like);
}
