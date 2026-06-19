import assert from "node:assert";
import * as userQueries from "#src/queries/user-queries.js";
import type { Profile, VerifyCallback } from "passport-google-oauth20";

export async function googleOauth2Verify(
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback,
) {
  try {
    const user = await userQueries.getUserById(profile._json.sub);

    if (!user) {
      assert(profile._json.email, "_json.email is undefined");
      assert(profile._json.name, "_json.name is undefined");

      const userData: userQueries.CreateUserGoogleArguments = {
        email: profile._json.email,
        fullName: profile._json.name,
        id: profile._json.sub,
      };
      const createdUser = await userQueries.createUserGoogle(userData);

      done(null, createdUser);
      return;
    }

    done(null, user);
  } catch (error) {
    done(error, false);
  }
}
