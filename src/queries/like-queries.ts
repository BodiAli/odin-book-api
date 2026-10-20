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
