import * as userQueries from "#src/queries/user-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type {
  SignUpRequestBody,
  SignUpResponseBody,
} from "#src/schemas/sign-up.js";
import type { Request, Response } from "express";
import type { ClientError } from "#src/schemas/error-schemas.js";

export async function createUser(
  req: Request<unknown, unknown, SignUpRequestBody>,
  res: Response<SignUpResponseBody | ClientError>,
) {
  const { confirmPassword: _, ...userData } = req.body;

  try {
    const user = await userQueries.createUser(userData);
    const jwtToken = issueJwt(user.id);
    res.json({ token: jwtToken, user });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
    }
  }
}
