import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import { createPostRequestBody, postImage } from "#src/schemas/routes/posts.js";
import * as postsController from "#src/controllers/posts-controller.js";
import upload from "#src/config/multer.js";
import validateFile from "#src/middlewares/validate-file.js";

const postsRouter = Router();

postsRouter
  .route("/")
  .post(
    upload.single("postImage"),
    validateFile(postImage),
    validateBody(createPostRequestBody),
    postsController.createPost,
  )
  .get(postsController.getIndexPosts);

export default postsRouter;
