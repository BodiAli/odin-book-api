import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";

export async function followUser(currentUserId: string, userId: string) {
  if (currentUserId === userId) {
    throw new CustomHttpStatusError(400, "You cannot follow yourself.");
  }

  try {
    const followedByCurrentUser = await prisma.userFollow.findUnique({
      where: {
        followedById_followingId: {
          followedById: currentUserId,
          followingId: userId,
        },
      },
      include: {
        following: true,
      },
    });
    if (followedByCurrentUser) {
      throw new CustomHttpStatusError(
        409,
        `You already follow ${followedByCurrentUser.following.fullName}.`,
      );
    }

    await prisma.userFollow.create({
      data: {
        followedById: currentUserId,
        followingId: userId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new CustomHttpStatusError(404, "User not found.");
      }
    }

    throw error;
  }
}
