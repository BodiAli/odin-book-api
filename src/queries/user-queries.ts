import * as bcrypt from "bcrypt";
import prisma from "#src/lib/prisma-client.js";
import { Prisma } from "#src/generated/prisma/client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { User } from "#src/types/current-user.js";

export async function getUserWithPasswordByEmail(
  email: string,
): Promise<(User & { password: string | null }) | null> {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      profile: {
        select: {
          imageUrl: true,
        },
      },
    },
    omit: { password: false },
  });

  return user
    ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        password: user.password,
        picture: user.profile?.imageUrl ?? null,
        provider: user.provider,
      }
    : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      profile: {
        select: {
          imageUrl: true,
        },
      },
    },
  });
  return user
    ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        picture: user.profile?.imageUrl ?? null,
        provider: user.provider,
      }
    : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      profile: {
        select: {
          imageUrl: true,
        },
      },
    },
  });

  return user
    ? {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        picture: user.profile?.imageUrl ?? null,
        provider: user.provider,
      }
    : null;
}

export async function createUserLocal({
  email,
  fullName,
  password,
}: CreateUserLocalArguments): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const { profile, ...user } = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
      },
      include: {
        profile: {
          select: {
            imageUrl: true,
          },
        },
      },
    });

    return { ...user, picture: profile?.imageUrl ?? null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const field = (
          error.meta?.["driverAdapterError"] as {
            cause: {
              constraint: {
                fields: string[];
              };
            };
          }
        ).cause.constraint.fields["0"];

        if (field === "email") {
          throw new CustomHttpStatusError(409, "Email already exists.");
        }
        if (field === "username") {
          throw new CustomHttpStatusError(409, "Username already exists.");
        }
      }
    }

    throw error;
  }
}

export async function createUserGoogle({
  email,
  fullName,
  id,
}: CreateUserGoogleArguments) {
  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      id,
      password: null,
      provider: "google",
    },
  });

  return user;
}

export interface CreateUserLocalArguments {
  email: string;
  fullName: string;
  password: string;
}
export interface CreateUserGoogleArguments {
  id: string;
  email: string;
  fullName: string;
}
