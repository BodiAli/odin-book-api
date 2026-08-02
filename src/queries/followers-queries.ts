import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";

export async function followUser(currentUserId: string, userId: string) {
  try {
    await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        following: {
          connect: {
            id: userId,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new CustomHttpStatusError(404, "User not found.");
      }
    }

    throw error;
  }
}
