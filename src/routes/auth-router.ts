import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import {
  signUpRequestBody,
  logInRequestBody,
  oauth2RequestBody,
} from "#src/schemas/auth.js";
import * as authController from "#src/controllers/auth-controller.js";

const authRouter = Router();

authRouter.post(
  "/sign-up",
  validateBody(signUpRequestBody),
  authController.createUser,
);
authRouter.post(
  "/log-in",
  validateBody(logInRequestBody),
  authController.authenticateWithLocal,
);

authRouter.post(
  "/google",
  validateBody(oauth2RequestBody),
  authController.authenticateWithGoogle,
);
authRouter.post(
  "/github",
  validateBody(oauth2RequestBody),
  authController.authenticateWithGithub,
);

export default authRouter;
