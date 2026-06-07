import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";

passport.use(
  new LocalStrategy(
    { usernameField: "email", session: false },
    (email, password, done) => {
      const asyncHandler = async () => {
        try {
          const user = await userQueries.getUserWithPasswordByEmail(email);
          if (!user) {
            done(null, false, { message: "Incorrect email or password." });
            return;
          }

          const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password,
          );
          if (!isPasswordCorrect) {
            done(null, false, { message: "Incorrect email or password." });
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
