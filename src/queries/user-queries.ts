import * as bcrypt from "bcrypt";
import prisma from "#src/lib/prisma-client.js";
import { Prisma } from "#src/generated/prisma/client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { SignUpRequestBody } from "#src/schemas/sign-up.js";

export async function getUserWithPasswordByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    omit: { password: false },
  });

  return user;
}

export async function createUser({
  email,
  username,
  fullName,
  password,
}: Omit<SignUpRequestBody, "confirmPassword">) {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
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
