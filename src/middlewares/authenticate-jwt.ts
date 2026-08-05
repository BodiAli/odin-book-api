import passport from "passport";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { User } from "#src/types/routes/users.js";
import type { ClientError } from "#src/types/errors/errors.js";

export default function authenticateJwt(
  req: Request,
  res: Response<ClientError>,
  next: NextFunction,
) {
  (
    passport.authenticate(
      "jwt",
      { session: false },
      (err: Error | null, user: User | false) => {
        if (err) {
          next(err);
          return;
        }

        if (!user) {
          res.status(401).json({
            errors: [{ message: "Access token is missing or invalid." }],
          });
          return;
        }

        req.logIn(user, { session: false }, (err) => {
          if (err) {
            next(err);
            return;
          }
          next();
        });
      },
    ) as RequestHandler
  )(req, res, next);
}
