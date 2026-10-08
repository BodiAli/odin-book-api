import { cloudinary } from "#src/config/cloudinary.js";
import CustomHttpStatusError from "#src/errors/http-status-error.js";

export default async function deleteUpload(publicId: string): Promise<void> {
  const res = (await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  })) as { result: string };
  if (res.result !== "ok") {
    throw new CustomHttpStatusError(502, "Failed to delete upload.");
  }
}
