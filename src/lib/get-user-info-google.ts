import CustomHttpStatusError from "#src/errors/http-status-error.js";

export async function getUserInfoGoogle({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
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
    throw new Error("Authentication failed.");
  }

  const data = (await response.json()) as { id_token: string };
  return data;
}
