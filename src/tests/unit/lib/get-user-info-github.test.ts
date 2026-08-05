import { describe, it, afterEach, vi, expect } from "vitest";
import { getUserInfoGithub } from "#src/lib/get-user-info-github.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type {
  Oauth2RequestBody,
  Oauth2UserData,
} from "#src/types/routes/auth.js";

describe(getUserInfoGithub, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  const argumentsObj: Oauth2RequestBody = {
    code: "authorization-code",
    codeVerifier: "code-verifier",
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
        getUserInfoGithub({
          success: true,
          code: "authorization-code",
          codeVerifier: "code-verifier",
        }),
      ).rejects.not.toThrow(new CustomHttpStatusError(401, "Access denied"));
    });
  });

  describe("exchanging authorization code for an access token", () => {
    it("should throw a CustomHttpStatusError with a 400 status code and pass the error_description if error is 'invalid_grant'", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description:
              "code verifier did not match the code challenge sent in the request",
          }),
          { status: 400 },
        ),
      );

      await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
        new CustomHttpStatusError(
          400,
          "code verifier did not match the code challenge sent in the request",
        ),
      );
    });

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
    it("should throw a CustomHttpStatusError with a 502 status code when response is not ok", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: "expired-access-token" }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ message: "Invalid access token", status: "401" }),
            { status: 401 },
          ),
        );

      await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
        new CustomHttpStatusError(502, "Failed to authenticate with Github."),
      );
    });
  });

  describe("getting user emails", () => {
    it("should throw a CustomHttpStatusError with a 502 status code when response is not ok", async () => {
      expect.hasAssertions();

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "expired-access-token",
          }),
          { status: 200 },
        ),
      );
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            name: "test: github name",
            avatar_url: "test-image-url",
          }),
          { status: 200 },
        ),
      );
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Invalid access token",
            status: "401",
          }),
          { status: 401 },
        ),
      );

      await expect(getUserInfoGithub(argumentsObj)).rejects.toThrow(
        new CustomHttpStatusError(502, "Failed to authenticate with Github."),
      );
    });
  });

  describe("returning a successful response", () => {
    it("should return expected user data", async () => {
      expect.hasAssertions();

      const userData: Oauth2UserData = {
        email: "test-primary-email@test.com",
        name: "test: github name",
        picture: "test-image-url",
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
          }),
          { status: 200 },
        ),
      );
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            name: "test: github name",
            avatar_url: "test-image-url",
          }),
          { status: 200 },
        ),
      );
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              email: "test-not-primary-email@test.com",
              verified: true,
              primary: false,
            },
            {
              email: "test-primary-email@test.com",
              verified: true,
              primary: true,
            },
          ]),
          { status: 200 },
        ),
      );

      await expect(getUserInfoGithub(argumentsObj)).resolves.toStrictEqual(
        userData,
      );
    });
  });
});
