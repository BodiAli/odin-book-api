import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";
import type { User } from "#src/types/users.js";

passport.use(
  new LocalStrategy(
    { session: false, usernameField: "email" },
    (email, password, done) => {
      const message = "Incorrect email or password.";
      const asyncHandler = async () => {
        try {
          const user = await userQueries.getUserWithPasswordByEmail(email);
          if (!user) {
            done(null, false, { message });
            return;
          }

          if (!user.password) {
            done(null, false, { message });
            return;
          }

          const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password,
          );
          if (!isPasswordCorrect) {
            done(null, false, { message });
            return;
          }

          const authenticatedUser: User = {
            email: user.email,
            fullName: user.fullName,
            provider: user.provider,
            id: user.id,
            picture: user.picture,
            isOnline: user.isOnline,
            isGuest: user.isGuest,
          };
          done(null, authenticatedUser);
        } catch (error) {
          done(error);
        }
      };

      void asyncHandler();
    },
  ),
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (payload: { sub: string }, done) => {
      const asyncHandler = async () => {
        try {
          const user = await userQueries.getUserById(payload.sub);

          if (!user) {
            done(null, false);
            return;
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      };

      void asyncHandler();
    },
  ),
);
