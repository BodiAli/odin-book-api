import type { ClientError } from "#src/types/errors/errors.js";
import type { Request, Response } from "express";

export default function resourceNotFound(
  _req: Request,
  res: Response<ClientError>,
): void {
  res.status(404).json({ errors: [{ message: "Resource not found." }] });
}
