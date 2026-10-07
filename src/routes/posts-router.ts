import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import { createPostRequestBody } from "#src/schemas/routes/posts.js";
import * as postsController from "#src/controllers/posts-controller.js";

const postsRouter = Router();

postsRouter.post(
  "/",
  validateBody(createPostRequestBody),
  postsController.createPost,
);

export default postsRouter;
