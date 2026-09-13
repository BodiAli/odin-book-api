import * as jwt from "jsonwebtoken";
import issueJwt from "#src/utils/issue-jwt.js";
import config from "#src/config/config.js";

describe(issueJwt, () => {
  it("should return a jwt", () => {
    expect.hasAssertions();

    const token = issueJwt("test-user-id", "10m");

    expect(jwt.verify(token, config.jwtSecret)).toMatchObject({
      sub: "test-user-id",
    });
  });
});
