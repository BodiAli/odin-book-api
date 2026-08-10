import passport from "passport";
import jwt from "jsonwebtoken";
import * as userQueries from "#src/queries/user-queries.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import issueJwt from "#src/utils/issue-jwt.js";
import { getOrCreateOauth2User } from "#src/services/oauth2-authenticate.js";
import { getIdTokenGoogle } from "#src/lib/get-user-info-google.js";
import { getUserInfoGithub } from "#src/lib/get-user-info-github.js";
import type {
  SignUpRequestBody,
  AuthenticatedResponse,
  Oauth2RequestBody,
  Oauth2UserData,
} from "#src/types/routes/auth.js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ClientError } from "#src/types/errors/errors.js";
import type { User } from "#src/types/routes/users.js";

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
    const data = await getIdTokenGoogle(req.body);
    const payload = jwt.decode(data.id_token) as Oauth2UserData;
    const user = await getOrCreateOauth2User(payload, "GOOGLE");
    const jwtToken = issueJwt(user.id);

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
  req: Request<unknown, unknown, Oauth2RequestBody>,
  res: Response<AuthenticatedResponse | ClientError>,
  next: NextFunction,
) {
  try {
    const userInfo = await getUserInfoGithub(req.body);
    const user = await getOrCreateOauth2User(userInfo, "GITHUB");
    const jwtToken = issueJwt(user.id);

    res.json({
      token: jwtToken,
      user,
    });
  } catch (error) {
    if (error instanceof CustomHttpStatusError) {
      res.status(error.code).json({ errors: [{ message: error.message }] });
      return;
    }
    next(error);
  }
}

export async function signInAsGuest(
  _req: Request,
  res: Response<AuthenticatedResponse>,
  next: NextFunction,
) {
  try {
    const guest = await userQueries.getOrCreateGuestUser();
    const token = issueJwt(guest.id, "30m");

    res.json({ token, user: guest });
  } catch (error) {
    next(error);
  }
}
