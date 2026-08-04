import express from "express";
import authRouter from "./auth-router.js";
import usersRouter from "./users-router.js";
import "#src/config/passport.js";

const indexRouter = express.Router();
indexRouter.use(express.json());

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", usersRouter);

export default indexRouter;
