import { notificationsResponse } from "#src/schemas/routes/notifications.js";
import {
  serverErrorResponse,
  unauthorizedResponse,
} from "../common/responses.js";
import { security } from "../common/security.js";
import registry from "../registry.js";

registry.registerPath({
  method: "get",
  path: "/notifications",
  tags: ["notifications"],
  description: "Retrieves current user notifications.",
  security,
  responses: {
    200: {
      summary: "OK",
      description: "Current user notifications are retrieved.",
      content: {
        "application/json": {
          schema: notificationsResponse,
        },
      },
    },
    401: unauthorizedResponse,
    500: serverErrorResponse,
  },
});
