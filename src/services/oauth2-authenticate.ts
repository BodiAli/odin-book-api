import * as userQueries from "#src/queries/user-queries.js";
import * as profileQueries from "#src/queries/profile-queries.js";
import type { Oauth2UserData } from "#src/types/auth.js";
import type { User } from "#src/types/current-user.js";
import type { Provider } from "#src/generated/prisma/enums.js";

export async function returnOrCreateOauth2User(
  userData: Oauth2UserData,
  provider: Provider,
): Promise<User> {
  const user = await userQueries.getUserByEmail(userData.email);

  if (!user) {
    const createdUser = await userQueries.createUserOauth({
      email: userData.email,
      fullName: userData.name,
      provider,
    });
    const profile = await profileQueries.createProfile({
      userId: createdUser.id,
      imageUrl: userData.picture,
      description: null,
    });

    return { ...createdUser, picture: profile.imageUrl };
  }

  const imageUrl = await profileQueries.createOrUpdateProfilePicture(
    user.id,
    userData.picture,
  );
  return { ...user, picture: imageUrl };
}
