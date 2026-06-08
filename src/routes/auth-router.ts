import { Router } from "express";

const authRouter = Router();

authRouter.post("/sign-up", (_req, res) => {
  res.json("HII");
});

export default authRouter;
