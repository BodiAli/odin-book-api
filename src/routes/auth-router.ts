import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import { signUpRequestBody } from "#src/schemas/auth/sign-up.js";
import * as authController from "#src/controllers/auth-controller.js";
import { logInRequestBody } from "#src/schemas/auth/log-in.js";

const authRouter = Router();

authRouter.post(
  "/sign-up",
  validateBody(signUpRequestBody),
  authController.createUser,
);
authRouter.post(
  "/log-in",
  validateBody(logInRequestBody),
  authController.authenticateUser,
);

export default authRouter;
