import generateNotificationMessage from "#src/utils/generate-notification-message.js";

describe(generateNotificationMessage, () => {
  it("should generate a notification when type is 'FOLLOW'", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationEntities: {
        type: "FOLLOW",
        profile: {
          id: "test-profile-id",
        },
        comment: null,
        parentComment: null,
        post: null,
      },
    });

    expect(notificationMessage).toBe("test: userA started following you.");
  });

  it("should generate a notification when type is 'COMMENT'", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationEntities: {
        type: "COMMENT",
        comment: {
          id: "test-comment-id",
          content: "test: comment content",
        },
        post: { id: "test-post-id", title: "test: post title" },
        parentComment: null,
        profile: null,
      },
    });

    expect(notificationMessage).toBe(
      'test: userA commented on your post "test: post title"',
    );
  });

  it("should generate a notification when type is 'REPLY'", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationEntities: {
        type: "REPLY",
        comment: {
          id: "test-comment-id",
          content: "test: comment content",
        },
        post: { id: "test-post-id", title: "test: post title" },
        parentComment: {
          id: "test-parent-comment-id",
          content: "test: parent comment content",
        },
        profile: null,
      },
    });

    expect(notificationMessage).toBe(
      'test: userA replied to your comment "test: parent comment content"',
    );
  });

  it("should trim 'COMMENT' notification when post title is more than 50 characters", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationEntities: {
        type: "COMMENT",
        comment: { id: "test-comment-id", content: "test: comment content" },
        post: {
          id: "test-post-id",
          title: "test: post title" + "1".repeat(50),
        },
        parentComment: null,
        profile: null,
      },
    });

    expect(notificationMessage).toBe(
      'test: userA commented on your post "test: post title1111111111111111111111111111111..."',
    );
  });

  it("should trim 'REPLY' notification when comment content is more than 50 characters", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationEntities: {
        type: "REPLY",
        parentComment: {
          id: "test-parent-comment-id",
          content: "test: parent comment content" + "1".repeat(50),
        },
        post: { id: "test-post-id", title: "test: post title" },
        comment: { id: "test-comment-id", content: "test: comment content" },
        profile: null,
      },
    });

    expect(notificationMessage).toBe(
      'test: userA replied to your comment "test: parent comment content1111111111111111111..."',
    );
  });
});
