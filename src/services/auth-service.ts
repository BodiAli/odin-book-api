import assert from "node:assert";
import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import type { Profile, VerifyCallback } from "passport-google-oauth20";

export async function googleOauth2Verify(
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  done: VerifyCallback,
) {
  try {
    assert(profile._json.email, "_json.email is undefined");
    assert(profile._json.name, "_json.name is undefined");

    const user = await userQueries.getUserWithPasswordByEmail(
      profile._json.email,
    );
    if (!user) {
      const userData: userQueries.CreateUserGoogleArguments = {
        email: profile._json.email,
        fullName: profile._json.name,
        id: profile._json.sub,
      };

      const createdUser = await userQueries.createUserGoogle(userData);
      const imageUrl = await profileQueries.createOrUpdateProfilePicture(
        createdUser.id,
        profile._json.picture ?? null,
      );

      done(null, {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        provider: createdUser.provider,
        picture: imageUrl,
      });
      return;
    }

    const imageUrl = await profileQueries.createOrUpdateProfilePicture(
      user.id,
      profile._json.picture ?? null,
    );

    done(null, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      provider: user.provider,
      picture: imageUrl,
    });
  } catch (error) {
    done(error, false);
  }
}
