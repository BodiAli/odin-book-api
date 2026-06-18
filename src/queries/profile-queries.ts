import prisma from "#src/lib/prisma-client.js";

export async function createProfile({
  userId,
  imageUrl,
  description,
}: CreateProfileArguments) {
  const profile = await prisma.profile.create({
    data: {
      userId,
      imageUrl,
      description,
    },
  });

  return profile;
}

export interface CreateProfileArguments {
  userId: string;
  imageUrl: string | null;
  description: string | null;
}
