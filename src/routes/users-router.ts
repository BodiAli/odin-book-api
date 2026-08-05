import { Router } from "express";
import * as usersController from "#src/controllers/users-controller.js";

const usersRouter = Router();

usersRouter.post(
  "/:userId/followers",
  usersController.createFollowerForTargetUser,
);

export default usersRouter;
