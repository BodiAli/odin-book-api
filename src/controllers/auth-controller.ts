import * as userQueries from "#src/queries/user-queries.js";
import type { SignUpRequestBody } from "#src/schemas/sign-up.js";
import type { Request, Response } from "express";

export async function createUser(
  req: Request<{}, {}, SignUpRequestBody>,
  res: Response,
) {
  const { confirmPassword: _, ...userData } = req.body;
  const user = await userQueries.createUser(userData);
  const jwtToken = issueJwt();
}
