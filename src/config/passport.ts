import assert from "node:assert";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as bcrypt from "bcrypt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as userQueries from "#src/queries/user-queries/user-queries.js";
import type { User } from "#src/schemas/users/user-schema.js";
import type { CreateUserArguments } from "#src/queries/user-queries/user-queries-types.js";

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
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    },
    (_accessToken, _refreshToken, profile, done) => {
      const asyncHandler = async () => {
        try {
          const user = await userQueries.getUserById(profile.id);

          if (!user) {
            assert(profile._json.email, "_json.email is undefined");
            assert(profile._json.name, "_json.name is undefined");

            const userData: CreateUserArguments = {
              email: profile._json.email,
              fullName: profile._json.name,
              provider: "google",
              password: null,
            };
            const createdUser = await userQueries.createUser(userData);

            done(null, createdUser);
            return;
          }

          done(null, user);
        } catch (error) {
          done(error, false);
        }
      };

      void asyncHandler();
    },
  ),
);
