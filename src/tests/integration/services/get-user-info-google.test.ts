import { afterEach, describe, expect, it, vi } from "vitest";
import { getUserInfoGoogle } from "#src/services/get-user-info-google.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";

describe(getUserInfoGoogle, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  const argumentsObj = {
    code: "authorization-code",
    codeVerifier: "code-verifier",
  };

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

    await expect(getUserInfoGoogle(argumentsObj)).rejects.toThrow(
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

    await expect(getUserInfoGoogle(argumentsObj)).rejects.toThrow(
      new Error("Authentication failed."),
    );
  });

  it("should return 'id_token' when authorization code is valid", async () => {
    expect.hasAssertions();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id_token: "idToken" }), {
        status: 200,
      }),
    );

    await expect(getUserInfoGoogle(argumentsObj)).resolves.toStrictEqual({
      id_token: "idToken",
    });
  });
});
