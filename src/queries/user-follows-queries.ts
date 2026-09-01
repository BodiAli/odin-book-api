import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";
import type { PublicUser } from "#src/types/routes/users.js";

export async function followUser(
  currentUserId: string,
  userId: string,
): Promise<void> {
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new CustomHttpStatusError(404, "No user to follow was found.");
    }

    throw error;
  }
}

export async function getNumOfFollowers(userId: string): Promise<number> {
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

export async function getNumOfFollowing(userId: string): Promise<number> {
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

  const userFollowers = await prisma.userFollow.findMany({
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

  return userFollowers.map((userFollow) => {
    const { followedBy } = userFollow;
    const { profile, ...follower } = followedBy;

    return {
      ...follower,
      picture: profile ? profile.imageUrl : null,
    };
  });
}

export async function getFollowings(userId: string): Promise<PublicUser[]> {
  const doesUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!doesUserExist) {
    throw new CustomHttpStatusError(404, "User not found.");
  }

  const userFollowings = await prisma.userFollow.findMany({
    where: {
      followedById: userId,
    },
    include: {
      following: {
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
      following: {
        fullName: "asc",
      },
    },
  });

  return userFollowings.map((userFollow) => {
    const { following: followingUser } = userFollow;
    const { profile, ...following } = followingUser;

    return {
      ...following,
      picture: profile ? profile.imageUrl : null,
    };
  });
}

export async function unfollowUser(
  currentUserId: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.userFollow.delete({
      where: {
        followedById_followingId: {
          followedById: currentUserId,
          followingId: userId,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CustomHttpStatusError(404, "No user to unfollow was found.");
    }
    throw error;
  }
}
