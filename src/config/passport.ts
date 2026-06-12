import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as bcrypt from "bcrypt";
import * as userQueries from "#src/queries/user-queries.js";

passport.use(
  new LocalStrategy({ session: false }, (username, password, done) => {
    const asyncHandler = async () => {
      try {
        const user = await userQueries.getUserWithPasswordByUsername(username);
        if (!user) {
          done(null, false, { message: "Incorrect username or password." });
          return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          done(null, false, { message: "Incorrect username or password." });
          return;
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    };

    void asyncHandler();
  }),
);
