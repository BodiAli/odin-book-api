import cloudinary from "cloudinary";
import deleteUpload from "#src/services/delete-upload.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";

describe("delete upload", () => {
  const mockDestroy = vi.spyOn(cloudinary.v2.uploader, "destroy");

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should reject with an error when destroying fails", async () => {
    expect.hasAssertions();

    mockDestroy.mockResolvedValue({ result: "not found" });

    await expect(deleteUpload("test-public-id")).rejects.toThrow(
      new CustomHttpStatusError(502, "Failed to delete upload."),
    );
  });

  it("should not reject when result is ok", async () => {
    expect.hasAssertions();

    mockDestroy.mockResolvedValue({ result: "ok" });

    await expect(deleteUpload("test-public-id")).resolves.not.toThrow();
  });
});
