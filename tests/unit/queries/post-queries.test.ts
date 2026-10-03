import prisma from "#src/db/prisma-client.js";
import * as postQueries from "#src/queries/post-queries.js";
import type { Post } from "#src/types/routes/posts.js";

describe("post queries", () => {
  describe(postQueries.createPost, () => {
    it("should create a new post", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });

      await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageUrl: null,
        imageId: null,
      });
      const post = await prisma.post.findFirst({
        where: {
          title: "test: post title",
        },
      });

      expect(post).not.toBeNull();
    });

    it("should return the created post", async () => {
      expect.hasAssertions();

      const user = await prisma.user.create({
        data: {
          email: "test-email@test.com",
          fullName: "test: full name",
        },
      });

      const createdPost = await postQueries.createPost({
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });

      expect(createdPost).toStrictEqual<Post>({
        id: expect.any(String) as string,
        userId: user.id,
        content: "test: post content",
        title: "test: post title",
        imageUrl: "test-image-url",
        imageId: "test-image-id",
      });
    });
  });
});
