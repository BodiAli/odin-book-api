import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
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
