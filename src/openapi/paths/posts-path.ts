import { clientError } from "#src/schemas/errors/errors.js";
import {
  createPostRequestBody,
  createPostResponseBody,
  getIndexPostsResponseBody,
} from "#src/schemas/routes/posts.js";
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
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPostRequestBody,
        },
      },
    },
  },
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

registry.registerPath({
  path: "/posts",
  method: "get",
  tags: ["posts"],
  description:
    "Get posts for index page. These posts are posts of the current user and posts of the current user followings.",
  security,
  parameters: [
    {
      in: "query",
      name: "last_cursor_id",
      schema: {
        type: "string",
      },
    },
  ],
  responses: {
    200: {
      summary: "OK",
      description: "Posts fetched successfully.",
      content: {
        "application/json": {
          schema: getIndexPostsResponseBody,
        },
      },
    },
    404: {
      summary: "Not found",
      description: "Cursor post not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    401: unauthorizedResponse,
    500: serverErrorResponse,
  },
});
