import assert from "node:assert";
import prisma from "#src/db/prisma-client.js";
import type { ProfileModel } from "#src/generated/prisma/models.js";

export async function createProfile({
  userId,
  imageUrl,
  description,
}: CreateProfileArguments): Promise<ProfileModel> {
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
): Promise<string | null> {
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

export async function getProfilePicture(
  userId: string,
): Promise<string | null> {
  const profilePicture = await prisma.profile.findUnique({
    where: {
      userId,
    },
    select: {
      imageUrl: true,
    },
  });
  assert(profilePicture, "Profile not found");

  return profilePicture.imageUrl;
}

export interface CreateProfileArguments {
  userId: string;
  imageUrl: string | null;
  description: string | null;
}
