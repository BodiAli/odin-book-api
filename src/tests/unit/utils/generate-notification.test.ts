import generateNotification from "#src/utils/generate-notification.js";
import * as userQueries from "#src/queries/user-queries.js";
import type { User } from "#src/types/routes/users.js";

describe(generateNotification, () => {
  let userA: User;
  let userB: User;

  beforeAll(async () => {
    userA = await userQueries.createUserLocal({
      email: "userA@test.com",
      fullName: "test: userA",
      password: "test: password",
    });
    userB = await userQueries.createUserLocal({
      email: "userB@test.com",
      fullName: "test: userB",
      password: "test: password",
    });
  });

  it("should generate a notification when type is 'FOLLOW'", async () => {
    expect.hasAssertions();

    const followNotification = await generateNotification({
      actorName: userA.fullName,
      type: "FOLLOW",
      entityId: null,
    });

    expect(followNotification).toBe("test: userA started following you.");
  });

  it.todo("should generate a notification when type is 'COMMENT'", async () => {
    expect.hasAssertions();

    const commentNotification = await generateNotification({
      actorName: userA.fullName,
      type: "COMMENT",
      entityId: "",
    });
  });
});
