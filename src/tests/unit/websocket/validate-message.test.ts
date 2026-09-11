import CustomWebSocketError from "#src/errors/websocket-error.js";
import validateMessage from "#src/websocket/validate-message.js";

describe("validate message", () => {
  it("should throw error when message is not JSON", () => {
    expect.hasAssertions();

    expect(() => {
      validateMessage(Buffer.from("invalid JSON"));
    }).toThrow(new CustomWebSocketError(1007, "Invalid JSON"));
  });

  it("should throw error when message event is not supported", () => {
    expect.hasAssertions();

    expect(() => {
      validateMessage(Buffer.from('{"type": "invalid event"}'));
    }).toThrow("Invalid event type.");
  });

  it("should throw error when message data is empty", () => {
    expect.hasAssertions();

    expect(() => {
      validateMessage(
        Buffer.from('{"type": "NOTIFICATION_FOLLOW", "data": ""}'),
      );
    }).toThrow("Data cannot be empty.");
  });

  it("should not throw an error when data is valid", () => {
    expect.hasAssertions();

    expect(() => {
      validateMessage(
        Buffer.from('{"type": "NOTIFICATION_FOLLOW", "data": "valid data"}'),
      );
    }).not.toThrow();
  });
});
