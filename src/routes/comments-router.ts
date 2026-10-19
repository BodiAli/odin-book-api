import { Router } from "express";
import * as commentsController from "#src/controllers/comments-controller.js";
import validateBody from "#src/middlewares/validate-body.js";
import {
  createReplyRequest,
  updateCommentRequest,
} from "#src/schemas/routes/comments.js";

const commentsRouter = Router();

commentsRouter
  .route("/:commentId")
  .patch(validateBody(updateCommentRequest), commentsController.updateComment)
  .delete(commentsController.deleteComment);

commentsRouter
  .route("/:commentId/replies")
  .get(commentsController.getCommentReplies)
  .post(validateBody(createReplyRequest), commentsController.createReply);

export default commentsRouter;
