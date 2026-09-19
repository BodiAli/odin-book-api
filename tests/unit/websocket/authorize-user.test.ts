import { JsonWebTokenError } from "jsonwebtoken";
import authorizeUser from "#src/websocket/authorize-user.js";
import issueJwt from "#src/utils/issue-jwt.js";

describe("authorize-user", () => {
  it("should throw an error when token is not found", () => {
    expect.hasAssertions();

    const url = "/";

    expect(() => {
      authorizeUser(url);
    }).toThrow(new Error("Unauthorized"));
  });

  it("should throw an error when token is invalid", () => {
    expect.hasAssertions();

    const token = "invalid-token";
    const url = `/?token=${token}`;

    expect(() => {
      authorizeUser(url);
    }).toThrow(new JsonWebTokenError("jwt malformed"));
  });

  it("should return user id", () => {
    expect.hasAssertions();

    const token = issueJwt("test-userId", "10m");
    const url = `/?token=${token}`;

    const userId = authorizeUser(url);

    expect(userId).toBe("test-userId");
  });
});
