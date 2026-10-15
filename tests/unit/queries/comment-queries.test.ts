import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as commentQueries from "#src/queries/comment-queries.js";

describe("comment queries", () => {
  describe(commentQueries.createComment, () => {
    it("should throw an error when post does not exist", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });

      await expect(
        commentQueries.createComment({
          userId: user.id,
          postId: "non-existing-id",
          content: "test: comment content",
        }),
      ).rejects.toThrow(new CustomHttpStatusError(404, "Post not found."));
    });
  });
});
