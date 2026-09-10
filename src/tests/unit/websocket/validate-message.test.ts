import isMessageValid from "#src/websocket/validate-message.js";

describe("validate message", () => {
  it("should return false when message is not JSON", () => {
    expect.hasAssertions();

    const isValid = isMessageValid(Buffer.from("invalid JSON"));

    expect(isValid).toBe(false);
  });

  it("should return false when message is not valid schema", () => {
    expect.hasAssertions();

    const isValid = isMessageValid(Buffer.from('{"JSON": true}'));

    expect(isValid).toBe(true);
  });
});
