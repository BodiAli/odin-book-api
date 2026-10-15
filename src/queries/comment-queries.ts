export async function createComment({
  userId,
  postId,
  content,
}: {
  userId: string;
  postId: string;
  content: string;
}): Promise<{ id: string }> {}
