import CustomHttpStatusError from "#src/errors/http-status-error.js";

interface ErrorResponse {
  error: string;
  error_description: string;
}

interface SuccessfulResponse {
  access_token: string;
}

type GithubResponse = ErrorResponse | SuccessfulResponse;

export async function getUserInfoGithub({ code }: { code: string }) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
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
  });
  /* 
    Github returns a 200 status code regardless of request error so when it responds with
    a status code that is not 200 it means that this error is unexpected.
   */
  if (!response.ok) {
    throw new CustomHttpStatusError(502, "Failed to authenticate with Github.");
  }

  const data = (await response.json()) as GithubResponse;

  if ("error" in data) {
    if (data.error === "unverified_user_email") {
      throw new CustomHttpStatusError(
        400,
        "Please verify your Github email before authenticating with Github.",
      );
    }
    throw new CustomHttpStatusError(400, data.error_description);
  }

  console.log("DATA", data);
}
