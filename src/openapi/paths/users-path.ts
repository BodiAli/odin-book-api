import { clientError, serverError } from "#src/schemas/errors/errors.js";
import { followersResponse } from "#src/schemas/routes/users.js";
import registry from "../registry.js";

registry.registerPath({
  path: "/users/{userId}/followers",
  method: "post",
  tags: ["user-follow"],
  security: [
    {
      bearerHttpAuthorization: [],
    },
  ],
  parameters: [
    {
      in: "path",
      name: "userId",
      required: true,
      schema: {
        type: "string",
      },
    },
  ],
  responses: {
    204: {
      summary: "OK",
      description: "Followed target user successfully.",
    },
    401: {
      summary: "Unauthorized",
      description: "Access token is missing or invalid",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    404: {
      summary: "Not found",
      description: "Target user is not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: {
      summary: "Internal server error.",
      description: "Unexpected error occurred.",
      content: {
        "application/json": {
          schema: serverError,
        },
      },
    },
  },
});

registry.registerPath({
  path: "/users/{userId}/followers",
  method: "get",
  tags: ["user-follow"],
  security: [
    {
      bearerHttpAuthorization: [],
    },
  ],
  parameters: [
    {
      in: "path",
      name: "userId",
      required: true,
      schema: {
        type: "string",
      },
    },
    {
      in: "query",
      name: "count",
      required: false,
      schema: {
        type: "boolean",
      },
    },
  ],
  responses: {
    200: {
      summary: "OK",
      description: "Target user followers are retrieved.",
      content: {
        "application/json": {
          schema: followersResponse,
        },
      },
    },
    401: {
      summary: "Unauthorized",
      description: "Access token is missing or invalid",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    404: {
      summary: "Not found",
      description: "Target user is not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: {
      summary: "Internal server error.",
      description: "Unexpected error occurred.",
      content: {
        "application/json": {
          schema: serverError,
        },
      },
    },
  },
});
