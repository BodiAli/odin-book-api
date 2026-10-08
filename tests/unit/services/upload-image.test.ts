import { PassThrough } from "node:stream";
import cloudinary, {
  UploadStream,
  type UploadApiErrorResponse,
  type UploadApiOptions,
  type UploadApiResponse,
  type UploadResponseCallback,
} from "cloudinary";
import uploadImage from "#src/services/upload-image.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { Mock } from "vitest";

describe("upload image to cloudinary", () => {
  /* eslint-disable-next-line vitest/prefer-vi-mocked --
    explicitly casting the type as mock will prevent raising the error in
    mockImplementation about target signature provides too few arguments
  */
  const mockCloudinary = vi.spyOn(
    cloudinary.v2.uploader,
    "upload_stream",
  ) as Mock<
    (
      options?: UploadApiOptions,
      callback?: UploadResponseCallback,
    ) => UploadStream
  >;

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should reject with an error when upload fails", async () => {
    expect.hasAssertions();

    const error: UploadApiErrorResponse | undefined = {
      http_code: 400,
      message: "test: failed to upload",
      name: "error",
    };
    mockCloudinary.mockImplementation((_options, cb) => {
      assert(cb);
      cb(error, undefined);
      const stream = new PassThrough();
      return stream;
    });
    const buffer = Buffer.from("test");

    await expect(uploadImage(buffer)).rejects.toThrow(
      new CustomHttpStatusError(502, "Failed to upload file."),
    );
  });

  it("should return upload response on successful upload", async () => {
    expect.hasAssertions();

    const uploadResponse = {
      public_id: "test-public-id",
      secure_url: "test-secure-url",
    } as UploadApiResponse;
    mockCloudinary.mockImplementation((_options, cb) => {
      assert(cb);
      cb(undefined, uploadResponse);
      const stream = new PassThrough();
      return stream;
    });
    const buffer = Buffer.from("test");

    const response = await uploadImage(buffer);

    expect(response).toStrictEqual({
      imageUrl: uploadResponse.secure_url,
      imageId: uploadResponse.public_id,
    });
  });
});
