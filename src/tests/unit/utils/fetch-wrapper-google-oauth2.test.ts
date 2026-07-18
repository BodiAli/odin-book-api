import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWrapperGoogleOauth2 } from "#src/utils/fetch-wrapper-google-oauth2.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";

describe(fetchWrapperGoogleOauth2, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  const url = "test-access_token-endpoint";
  const requestInit = {};

  it("should throw a CustomHttpStatusError when the authorization code is invalid", async () => {
    expect.hasAssertions();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_grant" }), {
        status: 400,
      }),
    );

    await expect(fetchWrapperGoogleOauth2(url, requestInit)).rejects.toThrow(
      new CustomHttpStatusError(400, "Invalid or expired authorization code."),
    );
  });

  it("should throw generic error message when the response fails for an unexpected reason", async () => {
    expect.hasAssertions();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "unexpected_reason" }), {
        status: 403,
      }),
    );

    await expect(fetchWrapperGoogleOauth2(url, requestInit)).rejects.toThrow(
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

    await expect(
      fetchWrapperGoogleOauth2(url, requestInit),
    ).resolves.toStrictEqual({
      id_token: "idToken",
    });
  });
});
