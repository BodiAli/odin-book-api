import { describe, it, afterEach, vi, expect } from "vitest";
import { getUserInfoGithub } from "#src/lib/get-user-info-github.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { Oauth2RequestBody } from "#src/types/auth.js";

describe(getUserInfoGithub, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  const argumentsObj: Oauth2RequestBody = {
    code: "authorization-code",
    success: true,
  };

  describe("error returned in request body from client", () => {
    it("should throw a CustomHttpStatusError with a 401 status code when 'success' argument is false", async () => {
      expect.hasAssertions();

      await expect(
        getUserInfoGithub({ success: false, error: "access_denied" }),
      ).rejects.toThrow(new CustomHttpStatusError(401, "Access denied"));
    });

    it("should not throw error when 'success' argument is true", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

      await expect(
        getUserInfoGithub({ success: true, code: "authorization-code" }),
      ).rejects.not.toThrow(new CustomHttpStatusError(401, "Access denied"));
    });
  });

  describe("exchanging authorization code for an access token", () => {
    /* 
      Github returns a 200 status code regardless of request error so when it responds with
      a code that is not 200 it means that this error is unexpected.
    */
    it("should throw a CustomHttpStatusError with a 502 status code if response is not ok", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "Unexpected Error" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
        new CustomHttpStatusError(502, "Failed to authenticate with Github."),
      );
    });

    it("should throw a CustomHttpStatusError with a 400 status code when the authorization code is invalid", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "bad_verification_code",
            error_description: "The code passed is incorrect or expired.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
        new CustomHttpStatusError(
          400,
          "The code passed is incorrect or expired.",
        ),
      );
    });

    it("should throw a CustomHttpStatusError with a 400 status code when the user has not verified their Github email", async () => {
      expect.hasAssertions();

      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "unverified_user_email",
            error_description: "The user must have a verified primary email.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
        new CustomHttpStatusError(
          400,
          "Please verify your Github email before authenticating with Github.",
        ),
      );
    });
  });

  describe("getting basic user info", () => {
    it.todo(
      "should throw a CustomHttpStatusError with a 401 status code when access token is missing or invalid",
      async () => {
        expect.hasAssertions();

        vi.spyOn(globalThis, "fetch").mockResolvedValue(
          new Response(
            JSON.stringify({ access_token: "expired-access-token" }),
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        );

        await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
          new CustomHttpStatusError(401, "Invalid access token"),
        );
      },
    );
  });
});
