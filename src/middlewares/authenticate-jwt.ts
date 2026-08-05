import passport from "passport";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { User } from "#src/types/users.js";

export default function authenticateJwt(
  req: Request,
  res: Response,
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
          res.status(401).json({ unauthorized: true });
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
