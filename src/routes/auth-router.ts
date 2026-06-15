import { Router } from "express";
import validateBody from "#src/middlewares/validate-body.js";
import { signUpRequestBody } from "#src/schemas/auth/sign-up.js";
import * as authController from "#src/controllers/auth-controller.js";
import { logInRequestBody } from "#src/schemas/auth/log-in.js";
import passport from "passport";

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

authRouter.get("/google", passport.authenticate("google"), (req, res) => {
  res.json("HELLO");
});

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.json("HELLO2");
  },
);

export default authRouter;
