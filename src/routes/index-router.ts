import express from "express";
import authenticateJwt from "#src/middlewares/authenticate-jwt.js";
import jsonErrorHandler from "#src/errors/json-error-handler.js";
import validateContentType from "#src/middlewares/validate-content-type.js";
import tokensRouter from "./tokens-router.js";
import usersRouter from "./users-router.js";
import notificationsRouter from "./notifications-router.js";
import postsRouter from "./posts-router.js";
import "#src/config/passport.js";

const indexRouter = express.Router();

indexRouter.use(express.json());
indexRouter.use(validateContentType);

indexRouter.use("/tokens", tokensRouter);
indexRouter.use("/users", usersRouter);
indexRouter.use("/notifications", authenticateJwt, notificationsRouter);
indexRouter.use("/posts", authenticateJwt, postsRouter);

indexRouter.use(jsonErrorHandler);

export default indexRouter;
