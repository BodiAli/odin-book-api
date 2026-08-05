import express from "express";
import authenticateJwt from "#src/middlewares/authenticate-jwt.js";
import authRouter from "./auth-router.js";
import usersRouter from "./users-router.js";
import "#src/config/passport.js";

const indexRouter = express.Router();
indexRouter.use(express.json());

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", authenticateJwt, usersRouter);

export default indexRouter;
