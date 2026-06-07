import prisma from "#src/lib/prisma-client.js";

export async function getUserWithPasswordByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    omit: { password: false },
  });

  return user;
}
