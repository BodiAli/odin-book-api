import prisma from "#src/db/prisma-client.js";
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

  return post;
}

export async function getPost(postId: string): Promise<Post> {}
