import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import { signUpRequestBody } from "#src/schemas/auth/sign-up.js";
import * as authController from "#src/controllers/auth-controller.js";

const authRouter = Router();

authRouter.post(
  "/sign-up",
  validateBody(signUpRequestBody),
  authController.createUser,
);

export default authRouter;
