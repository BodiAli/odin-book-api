import type { Request, Response } from "express";

export async function updateComment(
  req: Request,
  res: Response,
): Promise<void> {
  res.json("lol");
}
