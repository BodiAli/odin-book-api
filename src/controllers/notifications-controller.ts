import assert from "node:assert";
import type { Request, Response } from "express";

export async function getCurrentUserNotifications(
  req: Request,
  res: Response,
): Promise<void> {
  assert(req.user, "User not found");
}
