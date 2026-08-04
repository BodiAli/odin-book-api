import { Router } from "express";

const usersRouter = Router();

usersRouter.get("/:userId/followers");

export default usersRouter;
