import express from "express";
import authRouter from "./auth-router.js";
import "#src/config/passport.js";

const indexRouter = express.Router();
indexRouter.use(express.json());

indexRouter.use("/auth", authRouter);

export default indexRouter;
