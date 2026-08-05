import { Router } from "express";
import * as usersController from "#src/controllers/users-controller.js";

const usersRouter = Router();

usersRouter
  .route("/:userId/followers")
  .post(usersController.createFollowerForTargetUser)
  .get(usersController.getFollowers);

export default usersRouter;
