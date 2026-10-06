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

async function nextPageMetadata(
  userId: string,
  lastPost: Post | undefined,
): Promise<{
  nextCursorId: string | null;
  hasNextPage: boolean;
}> {
  const nextCursorId = lastPost ? lastPost.id : null;
  const nextPage = await prisma.post.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          user: {
            following: { some: { followedById: userId } },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    ...(nextCursorId && { skip: 1 }),
    ...(nextCursorId && {
      cursor: {
        id: nextCursorId,
      },
    }),
  });

  if (nextPage.length > 0) {
    return {
      hasNextPage: true,
      nextCursorId,
    };
  }

  return {
    nextCursorId: null,
    hasNextPage: false,
  };
}

export async function getIndexPosts(
  userId: string,
  lastCursorId?: string,
): Promise<{
  posts: Post[];
  metadata: {
    nextCursorId: string | null;
    hasNextPage: boolean;
  };
}> {
  let cursorId: string | undefined;
  if (lastCursorId) {
    try {
      const cursor = await getPost(lastCursorId);
      cursorId = cursor.id;
    } catch (error) {
      if (error instanceof CustomHttpStatusError) {
        throw new CustomHttpStatusError(404, "Cursor not found.");
      }
      throw error;
    }
  }

  const indexPosts = await prisma.post.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          user: {
            following: { some: { followedById: userId } },
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
    ...(cursorId && { skip: 1 }),
    ...(cursorId && {
      cursor: {
        id: cursorId,
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

  const lastPost = result.at(-1);
  const metadata = await nextPageMetadata(userId, lastPost);

  return {
    posts: result,
    metadata,
  };
}

export async function updatePost(postId: string): Promise<void> {}
