import { describe, expect, it } from "vitest";
import * as jwt from "jsonwebtoken";
import issueJwt from "#src/utils/issue-jwt.js";

describe(issueJwt, () => {
  it("should return a jwt", () => {
    expect.hasAssertions();

    const token = issueJwt("test-user-id", "10m");

    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({
      sub: "test-user-id",
    });
  });
});
