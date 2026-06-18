import { Router } from "express";
import passport from "passport";
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

authRouter.get("/google", passport.authenticate("google"));

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.json({ token: "JWT-TOKEN", user: req.user });
  },
);

export default authRouter;
