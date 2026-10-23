import generateNotificationMessage from "#src/utils/generate-notification-message.js";

describe(generateNotificationMessage, () => {
  it("should generate a notification when type is 'FOLLOW'", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationType: {
        type: "FOLLOW",
        comment: null,
        post: null,
      },
    });

    expect(notificationMessage).toBe("test: userA started following you.");
  });

  it("should generate a notification when type is 'COMMENT'", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationType: {
        type: "COMMENT",
        post: { title: "test: post title" },
        comment: null,
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
      notificationType: {
        type: "REPLY",
        comment: { content: "test: comment content" },
        post: null,
      },
    });

    expect(notificationMessage).toBe(
      'test: userA replied to your comment "test: comment content"',
    );
  });

  it("should trim 'COMMENT' notification when post title is more than 50 characters", () => {
    expect.hasAssertions();

    const notificationMessage = generateNotificationMessage({
      actorName: "test: userA",
      notificationType: {
        type: "COMMENT",
        comment: null,
        post: { title: "test: post title" + "1".repeat(50) },
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
      notificationType: {
        type: "REPLY",
        comment: { content: "test: comment content" + "1".repeat(50) },
        post: null,
      },
    });

    expect(notificationMessage).toBe(
      'test: userA replied to your comment "test: comment content11111111111111111111111111..."',
    );
  });
});
