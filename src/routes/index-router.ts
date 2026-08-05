import express, { type RequestHandler } from "express";
import passport from "passport";
import authRouter from "./auth-router.js";
import usersRouter from "./users-router.js";
import "#src/config/passport.js";

const indexRouter = express.Router();
indexRouter.use(express.json());

indexRouter.use("/auth", authRouter);
indexRouter.use(
  "/users",
  passport.authenticate("jwt", { session: false }) as RequestHandler,
  usersRouter,
);

export default indexRouter;
