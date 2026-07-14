import CustomHttpStatusError from "#src/errors/http-status-error.js";

export async function fetchWrapper(url: string, init: RequestInit) {
  const response = await fetch(url, init);

  if (!response.ok) {
    const { error } = (await response.json()) as { error: string };
    if (error === "invalid_grant") {
      throw new CustomHttpStatusError(
        400,
        "Invalid or expired authorization code.",
      );
    }
    throw new Error("Authentication failed.");
  }

  const data = (await response.json()) as { id_token: string };
  return data;
}
