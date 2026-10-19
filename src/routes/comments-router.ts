import { Router } from "express";
import * as commentsController from "#src/controllers/comments-controller.js";

const commentsRouter = Router();

commentsRouter.patch("/:commentId", commentsController.updateComment);

export default commentsRouter;
