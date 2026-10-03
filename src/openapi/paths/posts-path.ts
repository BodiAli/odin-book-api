import { createPostResponseBody } from "#src/schemas/routes/posts.js";
import {
  serverErrorResponse,
  unauthorizedResponse,
} from "../common/responses.js";
import { security } from "../common/security.js";
import registry from "../registry.js";

registry.registerPath({
  path: "/posts",
  method: "post",
  tags: ["posts"],
  description: "Create new post.",
  security,
  responses: {
    201: {
      summary: "Created",
      description: "Post created successfully.",
      content: {
        "application/json": {
          schema: createPostResponseBody,
        },
      },
    },
    401: unauthorizedResponse,
    500: serverErrorResponse,
  },
});
