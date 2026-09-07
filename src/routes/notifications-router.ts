import { Router } from "express";
import * as notificationsController from "#src/controllers/notifications-controller.js";

const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  notificationsController.getCurrentUserNotifications,
);

export default notificationsRouter;
