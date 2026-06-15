import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as bcrypt from "bcrypt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userQueries from "#src/queries/user-queries.js";
import type { User } from "#src/schemas/users/user-schema.js";

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

        const authenticatedUser: User = {
          fullName: user.fullName,
          username: user.username,
          id: user.id,
        };
        done(null, authenticatedUser);
      } catch (error) {
        done(error);
      }
    };

    void asyncHandler();
  }),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("ACCESS TOKEN", accessToken);
      console.log("REFRESH TOKEN", refreshToken);
      console.log("PROFILE", profile);
      console.log("DONE", done);
    },
  ),
);
