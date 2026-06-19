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

export async function createOrUpdateProfilePicture(
  userId: string,
  imageUrl: string | null,
) {
  const profile = await prisma.profile.upsert({
    create: {
      userId,
      imageUrl,
    },
    update: {
      imageUrl,
    },
    where: {
      userId,
    },
  });

  return profile.imageUrl;
}

export interface CreateProfileArguments {
  userId: string;
  imageUrl: string | null;
  description: string | null;
}
