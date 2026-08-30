import config from "#src/config/config.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { Oauth2RequestBody } from "#src/types/routes/auth.js";

interface IdToken {
  id_token: string;
}

export async function getIdTokenGoogle(
  requestBody: Oauth2RequestBody,
): Promise<IdToken> {
  if (!requestBody.success) {
    throw new CustomHttpStatusError(401, "Access denied");
  }
  const { code, codeVerifier } = requestBody;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: JSON.stringify({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleCallbackUrl,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const { error, error_description } = (await response.json()) as {
      error: string;
      error_description: string;
    };
    if (error === "invalid_grant") {
      throw new CustomHttpStatusError(400, error_description);
    }
    throw new CustomHttpStatusError(502, "Failed to authenticate with Google.");
  }

  const data = (await response.json()) as IdToken;
  return data;
}
