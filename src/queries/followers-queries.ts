import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";
import type { PublicUser } from "#src/types/users.js";

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

export async function getNumOfFollowers(userId: string) {
  const doesUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!doesUserExist) {
    throw new CustomHttpStatusError(404, "User not found.");
  }

  const numberOfFollowers = await prisma.userFollow.count({
    where: {
      followingId: userId,
    },
  });

  return numberOfFollowers;
}

export async function getNumOfFollowing(userId: string) {
  const doesUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!doesUserExist) {
    throw new CustomHttpStatusError(404, "User not found.");
  }

  const numberOfFollowers = await prisma.userFollow.count({
    where: {
      followedById: userId,
    },
  });

  return numberOfFollowers;
}

export async function getFollowers(userId: string): Promise<PublicUser[]> {
  const doesUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!doesUserExist) {
    throw new CustomHttpStatusError(404, "User not found.");
  }

  const userFollows = await prisma.userFollow.findMany({
    where: {
      followingId: userId,
    },
    include: {
      followedBy: {
        select: {
          id: true,
          fullName: true,
          isOnline: true,
          lastSeen: true,
          profile: {
            select: {
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      followedBy: {
        fullName: "asc",
      },
    },
  });

  return userFollows.map((userFollow) => {
    const { followedBy } = userFollow;
    const { profile, ...follower } = followedBy;

    return {
      ...follower,
      picture: profile ? profile.imageUrl : null,
    };
  });
}
