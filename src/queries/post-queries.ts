import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { Post } from "#src/types/routes/posts.js";

interface CreatePostArgument {
  userId: string;
  title: string;
  content: string;
  imageUrl: string | null;
  imageId: string | null;
}
export async function createPost({
  userId,
  title,
  content,
  imageId,
  imageUrl,
}: CreatePostArgument): Promise<Post> {
  const post = await prisma.post.create({
    data: {
      userId,
      title,
      content,
      imageUrl,
      imageId,
    },
  });
  const author = await userQueries.getPublicUser(post.userId);

  return { ...post, author };
}

export async function getPost(postId: string): Promise<Post> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  if (post === null) {
    throw new CustomHttpStatusError(404, "Post not found.");
  }

  const publicUser = await userQueries.getPublicUser(post.userId);

  return { ...post, author: publicUser };
}
