import prisma from "#src/db/prisma-client.js";
import * as profileQueries from "./profile-queries.js";
import type { Notification } from "#src/types/routes/notifications.js";

export async function getUserNotifications(
  currentUserId: string,
): Promise<Notification[]> {
  const user = await prisma.user.findUnique({
    where: {
      id: currentUserId,
    },
    include: {
      notificationsReceived: {
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });
  const actorProfilePicture =
    await profileQueries.getProfilePicture(currentUserId);
  assert(user, "User not found");

  const notificationsResponse = user.notificationsReceived.map<Notification>(
    ({ id, actor }) => {
      const text = `${actor.fullName} followed you.`;
      return {
        actor: {
          fullName: actor.fullName,
          id: actor.id,
          picture: actorProfilePicture,
        },
        id,
        text,
      };
    },
  );

  return notificationsResponse;
}
