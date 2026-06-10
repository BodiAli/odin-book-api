import * as bcrypt from "bcrypt";
import prisma from "#src/lib/prisma-client.js";
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

  const user = await prisma.user.create({
    data: {
      email,
      username,
      fullName,
      password: hashedPassword,
    },
  });

  return user;
}
