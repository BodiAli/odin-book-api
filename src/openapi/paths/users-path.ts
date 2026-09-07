import { clientError } from "#src/schemas/errors/errors.js";
import {
  followersResponse,
  followingsResponse,
} from "#src/schemas/routes/users.js";
import {
  serverErrorResponse,
  unauthorizedResponse,
} from "./common-responses.js";
import registry from "../registry.js";

registry.registerPath({
  path: "/users/{userId}/followers",
  method: "post",
  tags: ["user-follow"],
  description: "Follows target user.",
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
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "No user to follow was found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: serverErrorResponse,
  },
});

registry.registerPath({
  path: "/users/{userId}/followers",
  method: "get",
  tags: ["user-follow"],
  description: "Retrieves the followers of the target user.",
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
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "Target user is not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: serverErrorResponse,
  },
});

registry.registerPath({
  path: "/users/{userId}/followers",
  method: "delete",
  tags: ["user-follow"],
  description: "Unfollows target user.",
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
      description: "Unfollowed target user successfully.",
    },
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "No user to unfollow was found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: serverErrorResponse,
  },
});

registry.registerPath({
  path: "/users/{userId}/followings",
  method: "get",
  tags: ["user-follow"],
  description: "Retrieves target user followings.",
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
      description: "Target user followings are retrieved.",
      content: {
        "application/json": {
          schema: followingsResponse,
        },
      },
    },
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "Target user is not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: serverErrorResponse,
  },
});
