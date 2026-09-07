import assert from "node:assert";
import * as notificationQueries from "#src/queries/notification-queries.js";
import type { Request, Response } from "express";
import type { NotificationsResponse } from "#src/types/routes/notifications.js";

export async function getCurrentUserNotifications(
  req: Request,
  res: Response<NotificationsResponse>,
): Promise<void> {
  assert(req.user, "User not found");

  const notifications = await notificationQueries.getUserNotifications(
    req.user.id,
  );
  res.json({ notifications });
}
