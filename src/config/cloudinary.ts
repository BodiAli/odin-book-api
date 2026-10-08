import cloudinary from "cloudinary";

const cloudinaryUpload = cloudinary.v2.uploader.upload_stream;

export default cloudinaryUpload;
