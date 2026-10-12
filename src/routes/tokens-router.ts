import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import {
  logInRequestBody,
  oauth2RequestBody,
} from "#src/schemas/routes/tokens.js";
import * as tokensController from "#src/controllers/tokens-controller.js";

const oAuthRouter = Router();

oAuthRouter.post(
  "/local",
  validateBody(logInRequestBody),
  tokensController.authenticateWithLocal,
);
oAuthRouter.post(
  "/google",
  validateBody(oauth2RequestBody),
  tokensController.authenticateWithGoogle,
);
oAuthRouter.post(
  "/github",
  validateBody(oauth2RequestBody),
  tokensController.authenticateWithGithub,
);
oAuthRouter.post("/guest", tokensController.signInAsGuest);

export default oAuthRouter;
