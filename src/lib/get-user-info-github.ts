import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { Oauth2RequestBody } from "#src/types/auth.js";

interface ErrorResponse {
  error: string;
  error_description: string;
}
interface SuccessfulResponse {
  access_token: string;
}

type GithubResponse = ErrorResponse | SuccessfulResponse;

interface GithubEndpointErrorResponse {
  message: string;
  status: string;
}

export async function getUserInfoGithub(requestBody: Oauth2RequestBody) {
  if (!requestBody.success) {
    throw new CustomHttpStatusError(401, "Access denied");
  }

  const { code } = requestBody;
  const codeExchangeResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  /* 
    Github returns a 200 status code regardless of request error so when it responds with
    a status code that is not 200 it means that this error is unexpected.
   */
  if (!codeExchangeResponse.ok) {
    throw new CustomHttpStatusError(502, "Failed to authenticate with Github.");
  }
  const codeExchangeData =
    (await codeExchangeResponse.json()) as GithubResponse;
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
    },
  });
  // TODO: implement
  if (!userInfoResponse.ok) {
    if (userInfoResponse.status >= 400 && userInfoResponse.status <= 499) {
    }
  }

  const userInfoData = await userInfoResponse.json();

  console.log("User info data", userInfoData);
}
