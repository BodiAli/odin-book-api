import { afterEach, describe, expect, it, vi } from "vitest";
import { getIdTokenGoogle } from "#src/lib/get-user-info-google.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { Oauth2RequestBody } from "#src/types/auth.js";

describe(getIdTokenGoogle, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  const argumentsObj: Oauth2RequestBody = {
    code: "authorization-code",
    codeVerifier: "code-verifier",
    success: true,
  };

  it("should throw a CustomHttpStatusError with a 401 status code when 'success' argument is false", async () => {
    expect.hasAssertions();

    await expect(
      getIdTokenGoogle({ error: "access_denied", success: false }),
    ).rejects.toThrow(new CustomHttpStatusError(401, "Access denied"));
  });

  it("should throw a CustomHttpStatusError with the error description when error is 'invalid_grant'", async () => {
    expect.hasAssertions();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Invalid code verifier.",
        }),
        {
          status: 400,
        },
      ),
    );

    await expect(getIdTokenGoogle(argumentsObj)).rejects.toThrow(
      new CustomHttpStatusError(400, "Invalid code verifier."),
    );
  });

  it("should throw generic error message when the response fails for an unexpected reason", async () => {
    expect.hasAssertions();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "unexpected_reason" }), {
        status: 403,
      }),
    );

    await expect(getIdTokenGoogle(argumentsObj)).rejects.toThrow(
      new CustomHttpStatusError(502, "Failed to authenticate with Google."),
    );
  });

  it("should return 'id_token' when authorization code is valid", async () => {
    expect.hasAssertions();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id_token: "idToken" }), {
        status: 200,
      }),
    );

    await expect(getIdTokenGoogle(argumentsObj)).resolves.toStrictEqual({
      id_token: "idToken",
    });
  });
});
