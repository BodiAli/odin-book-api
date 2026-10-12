import { Router } from "express";
import * as usersController from "#src/controllers/users-controller.js";
import validateBody from "#src/middlewares/validate-body.js";
import authenticateJwt from "#src/middlewares/authenticate-jwt.js";
import { createUserRequestBody } from "#src/schemas/routes/users.js";

const usersRouter = Router();

usersRouter.post(
  "/",
  validateBody(createUserRequestBody),
  usersController.createUser,
);

usersRouter
  .route("/:userId/followers")
  .all(authenticateJwt)
  .post(usersController.createFollowerForTargetUser)
  .get(usersController.getFollowers)
  .delete(usersController.deleteFollowerOfTargetUser);

usersRouter.get(
  "/:userId/followings",
  authenticateJwt,
  usersController.getFollowings,
);

export default usersRouter;
