import assert from "node:assert";
import cloudinaryUpload from "#src/config/cloudinary.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { UploadApiResponse } from "cloudinary";

export default async function uploadImage(
  imageBuffer: Buffer,
): Promise<UploadApiResponse> {
  const response = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinaryUpload({ resource_type: "image" }, (err, uploadResult) => {
      if (err) {
        reject(new CustomHttpStatusError(err.http_code, err.message));
        return;
      }
      assert(uploadResult);

      resolve(uploadResult);
    }).end(imageBuffer);
  });

  return response;
}
