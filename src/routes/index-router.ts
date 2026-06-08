import { Router } from "express";
import authRouter from "./auth-router.js";

const indexRouter = Router();

indexRouter.use("/auth", authRouter);

export default indexRouter;
