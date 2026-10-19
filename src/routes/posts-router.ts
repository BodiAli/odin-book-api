import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import {
  createPostRequestBody,
  postImage,
  updatePostRequestBody,
} from "#src/schemas/routes/posts.js";
import * as postsController from "#src/controllers/posts-controller.js";
import upload from "#src/config/multer.js";
import validateFile from "#src/middlewares/validate-file.js";
import unauthorizeGuest from "#src/middlewares/unauthorize-guest.js";
import { createCommentRequest } from "#src/schemas/routes/comments.js";

const postsRouter = Router();

postsRouter
  .route("/")
  .post(
    unauthorizeGuest,
    upload.single("postImage"),
    validateFile(postImage),
    validateBody(createPostRequestBody),
    postsController.createPost,
  )
  .get(postsController.getIndexPosts);

postsRouter
  .route("/:postId")
  .get(postsController.getPost)
  .patch(
    unauthorizeGuest,
    upload.single("postImage"),
    validateFile(postImage),
    validateBody(updatePostRequestBody),
    postsController.updatePost,
  )
  .delete(unauthorizeGuest, postsController.deletePost);

postsRouter.get("/:postId/comments", postsController.getPostComments);
postsRouter.post(
  "/:postId/comments",
  validateBody(createCommentRequest),
  postsController.createPostComment,
);

export default postsRouter;
