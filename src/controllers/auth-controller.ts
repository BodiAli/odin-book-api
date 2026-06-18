import passport from "passport";
import * as userQueries from "#src/queries/user-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import issueJwt from "#src/utils/issue-jwt.js";
import type { SignUpRequestBody } from "#src/schemas/auth/sign-up.js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ClientError } from "#src/schemas/errors/error-schemas.js";
import type { User } from "#src/schemas/users/user-schema.js";
import type { AuthenticatedResponse } from "#src/schemas/auth/authenticated-response.js";

export async function createUser(
  req: Request<unknown, unknown, SignUpRequestBody>,
  res: Response<AuthenticatedResponse | ClientError>,
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
    throw error;
  }
}

export function authenticateUser(
  req: Request,
  res: Response<AuthenticatedResponse | ClientError>,
  next: NextFunction,
) {
  (
    passport.authenticate(
      "local",
      (err: unknown, user: User | false, info: { message: string }) => {
        if (err) {
          next(err);
          return;
        }

        if (!user) {
          res.status(401).json({ errors: [{ message: info.message }] });
          return;
        }

        const token = issueJwt(user.id, "2w");
        res.json({ token, user });
      },
    ) as RequestHandler
  )(req, res, next);
}
