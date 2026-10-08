import assert from "node:assert";
import { cloudinary } from "#src/config/cloudinary.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";
import type { UploadApiResponse } from "cloudinary";

export default async function uploadImage(
  imageBuffer: Buffer,
): Promise<{ imageId: string; imageUrl: string }> {
  const response = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, (err, uploadResult) => {
        if (err) {
          reject(new CustomHttpStatusError(err.http_code, err.message));
          return;
        }

        assert(uploadResult);
        resolve(uploadResult);
      })
      .end(imageBuffer);
  });

  return {
    imageUrl: response.secure_url,
    imageId: response.public_id,
  };
}
