import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import type { Oauth2UserInfo } from "#src/types/auth.js";
import type { User } from "#src/types/current-user.js";

export async function googleOauth2(userInfo: Oauth2UserInfo): Promise<User> {
  const user = await userQueries.getUserByEmail(userInfo.email);

  if (!user) {
    const createdUser = await userQueries.createUserGoogle({
      email: userInfo.email,
      fullName: userInfo.name,
      id: userInfo.sub,
    });
    const profile = await profileQueries.createProfile({
      userId: createdUser.id,
      imageUrl: userInfo.picture,
      description: null,
    });

    return { ...createdUser, picture: profile.imageUrl };
  }

  await profileQueries.createOrUpdateProfilePicture(user.id, userInfo.picture);
  return user;
}
