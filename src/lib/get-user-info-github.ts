import assert from "node:assert";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type {
  Oauth2RequestBody,
  Oauth2UserData,
} from "#src/types/routes/auth.js";

interface CodeErrorResponse {
  error: string;
  error_description: string;
}
interface CodeSuccessfulResponse {
  access_token: string;
}

type CodeExchangeResponse = CodeErrorResponse | CodeSuccessfulResponse;

interface UserInfoResponse {
  name: string;
  avatar_url: string;
}

type UserEmailsResponse = {
  email: string;
  verified: boolean;
  primary: boolean;
}[];

export async function getUserInfoGithub(
  requestBody: Oauth2RequestBody,
): Promise<Oauth2UserData> {
  if (!requestBody.success) {
    throw new CustomHttpStatusError(401, "Access denied");
  }

  const { code, codeVerifier } = requestBody;
  const codeExchangeResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        code_verifier: codeVerifier,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
  if (!codeExchangeResponse.ok) {
    const codeExchangeErrorResponse =
      (await codeExchangeResponse.json()) as CodeErrorResponse;
    if (codeExchangeErrorResponse.error === "invalid_grant") {
      throw new CustomHttpStatusError(
        400,
        codeExchangeErrorResponse.error_description,
      );
    }
    throw new CustomHttpStatusError(502, "Failed to authenticate with Github.");
  }
  const codeExchangeData =
    (await codeExchangeResponse.json()) as CodeExchangeResponse;
  if ("error" in codeExchangeData) {
    if (codeExchangeData.error === "unverified_user_email") {
      throw new CustomHttpStatusError(
        400,
        "Please verify your Github email before authenticating with Github.",
      );
    }
    throw new CustomHttpStatusError(400, codeExchangeData.error_description);
  }

  const { access_token } = codeExchangeData;

  const userInfoResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `bearer ${access_token}`,
      Accept: "application/json",
    },
  });
  if (!userInfoResponse.ok) {
    throw new CustomHttpStatusError(502, "Failed to authenticate with Github.");
  }
  const userInfoData = (await userInfoResponse.json()) as UserInfoResponse;

  const userEmailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `bearer ${access_token}`,
      Accept: "application/json",
    },
  });
  if (!userEmailsResponse.ok) {
    throw new CustomHttpStatusError(502, "Failed to authenticate with Github.");
  }
  const userEmailsData =
    (await userEmailsResponse.json()) as UserEmailsResponse;
  const primaryEmail = userEmailsData.find((email) => {
    return email.primary;
  });
  assert(primaryEmail, "Github primary email not found.");

  const userData: Oauth2UserData = {
    email: primaryEmail.email,
    name: userInfoData.name,
    picture: userInfoData.avatar_url,
  };

  return userData;
}
