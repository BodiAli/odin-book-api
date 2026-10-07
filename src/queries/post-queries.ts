import prisma from "#src/db/prisma-client.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import { Prisma } from "#src/generated/prisma/client.js";
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

type UpdatePostArgument = Partial<Omit<CreatePostArgument, "userId">>;

export async function updatePost(
  currentUserId: string,
  postId: string,
  postData: UpdatePostArgument,
): Promise<void> {
  const normalizeData = {
    ...(postData.title && { title: postData.title }),
    ...(postData.content && { content: postData.content }),
    ...(postData.imageUrl && { imageUrl: postData.imageUrl }),
    ...(postData.imageId && { imageId: postData.imageId }),
  };
  try {
    const post = await prisma.post.findUniqueOrThrow({
      where: {
        id: postId,
      },
    });
    if (post.userId !== currentUserId) {
      throw new CustomHttpStatusError(
        403,
        "You do not have permission to update this post.",
      );
    }
    await prisma.post.update({
      where: {
        id: postId,
      },
      data: normalizeData,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CustomHttpStatusError(404, "No post found to update.");
    }
    throw error;
  }
}

export async function deletePost(
  currentUserId: string,
  postId: string,
): Promise<void> {
  try {
    const post = await prisma.post.findUniqueOrThrow({
      where: {
        id: postId,
      },
    });
    if (post.userId !== currentUserId) {
      throw new CustomHttpStatusError(
        403,
        "You do not have permission to delete this post.",
      );
    }
    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CustomHttpStatusError(404, "No post found to delete.");
    }
    throw error;
  }
}
