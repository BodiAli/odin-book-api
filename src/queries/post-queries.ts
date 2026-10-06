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

export async function getIndexPosts(
  userId: string,
  lastCursorId?: string,
): Promise<Post[]> {
  const indexPosts = await prisma.post.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          user: {
            following: { every: { followedById: userId } },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isOnline: true,
          lastSeen: true,
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    ...(lastCursorId && { skip: 1 }),
    ...(lastCursorId && {
      cursor: {
        id: lastCursorId,
      },
    }),
  });

  const result = indexPosts.map<Post>((post) => {
    const {
      user: { profile, ...user },
      ...postWithoutUser
    } = post;
    const picture = profile ? profile.imageUrl : null;
    return {
      ...postWithoutUser,
      author: {
        ...user,
        picture,
      },
    };
  });

  return result;
}
