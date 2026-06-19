import * as bcrypt from "bcrypt";
import prisma from "#src/lib/prisma-client.js";
import { Prisma } from "#src/generated/prisma/client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";

export async function getUserWithPasswordByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    omit: { password: false },
  });

  return user;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  return user;
}

export async function createUserLocal({
  email,
  fullName,
  password,
}: CreateUserLocalArguments) {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
      },
    });

    return user;
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
