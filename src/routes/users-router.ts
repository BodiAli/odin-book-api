import { Router } from "express";
import * as usersController from "#src/controllers/users-controller.js";
import validateBody from "#src/middlewares/validate-body.js";
import authenticateJwt from "#src/middlewares/authenticate-jwt.js";
import { createUserRequestBody } from "#src/schemas/routes/users.js";
import unauthorizeGuest from "#src/middlewares/unauthorize-guest.js";

const usersRouter = Router();

usersRouter.post(
  "/",
  validateBody(createUserRequestBody),
  usersController.createUser,
);

usersRouter.get("/me", authenticateJwt, usersController.getCurrentUser);

usersRouter
  .route("/:userId/followers")
  .all(authenticateJwt)
  .post(unauthorizeGuest, usersController.createFollowerForTargetUser)
  .get(usersController.getFollowers)
  .delete(unauthorizeGuest, usersController.deleteFollowerOfTargetUser);

usersRouter.get(
  "/:userId/followings",
  authenticateJwt,
  usersController.getFollowings,
);

export default usersRouter;
