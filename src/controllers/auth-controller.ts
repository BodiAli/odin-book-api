import passport from "passport";
import jwt from "jsonwebtoken";
import * as userQueries from "#src/queries/user-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import issueJwt from "#src/utils/issue-jwt.js";
import { googleOauth2 } from "#src/services/google-oauth2-authenticate.js";
import { getUserInfoGoogle } from "#src/lib/get-user-info-google.js";
import { getUserInfoGithub } from "#src/lib/get-user-info-github.js";
import type {
  SignUpRequestBody,
  AuthenticatedResponse,
  Oauth2RequestBody,
  Oauth2UserData,
} from "#src/types/auth.js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ClientError } from "#src/types/errors.js";
import type { User } from "#src/types/current-user.js";

export async function createUser(
  req: Request<unknown, unknown, SignUpRequestBody>,
  res: Response<AuthenticatedResponse | ClientError>,
) {
  const { confirmPassword: _confirmPassword, ...userData } = req.body;

  try {
    const user = await userQueries.createUserLocal(userData);
    const jwt = issueJwt(user.id);
    res.json({ token: jwt, user });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    throw error;
  }
}

export function authenticateWithLocal(
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

        const jwt = issueJwt(user.id, "2w");
        res.json({ token: jwt, user });
      },
    ) as RequestHandler
  )(req, res, next);
}

export async function authenticateWithGoogle(
  req: Request<unknown, unknown, Oauth2RequestBody>,
  res: Response<AuthenticatedResponse | ClientError>,
  next: NextFunction,
) {
  try {
    const data = await getUserInfoGoogle(req.body);
    const payload = jwt.decode(data.id_token) as Oauth2UserData;
    const user = await googleOauth2(payload);
    const jwtToken = issueJwt(payload.sub);

    res.json({
      token: jwtToken,
      user,
    });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({
        errors: [
          {
            message: error.message,
          },
        ],
      });
      return;
    }
    next(error);
  }
}

export async function authenticateWithGithub(
  req: Request<unknown, unknown, { code: string }>,
  res: Response,
) {
  const { code } = req.body;

  const data = await getUserInfoGithub({ code });

  res.json("HIII");
}
