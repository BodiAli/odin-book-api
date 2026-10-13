import z from "zod";
import { clientError } from "#src/schemas/errors/errors.js";
import { authenticatedResponse } from "#src/schemas/routes/tokens.js";
import {
  createUserRequestBody,
  followersResponse,
  followingsResponse,
  getCurrentUserResponse,
} from "#src/schemas/routes/users.js";
import {
  invalidContentTypeResponse,
  invalidInputsResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "../common/responses.js";
import { security } from "../common/security.js";
import registry from "../registry.js";

registry.registerPath({
  method: "post",
  path: "/users",
  tags: ["users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserRequestBody,
        },
      },
    },
  },
  responses: {
    "201": {
      summary: "Account created.",
      description: "User signed up and created an account successfully.",
      content: {
        "application/json": {
          schema: authenticatedResponse,
        },
      },
      headers: z.object({
        location: z.string(),
      }),
    },
    "409": {
      summary: "Conflict with existing data.",
      description: "User entered an existing email.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "400": invalidInputsResponse,
    415: invalidContentTypeResponse,
    "500": serverErrorResponse,
  },
});

registry.registerPath({
  path: "/users/me",
  method: "get",
  security,
  responses: {
    200: {
      summary: "OK",
      description: "Current user retrieved successfully.",
      content: {
        "application/json": {
          schema: getCurrentUserResponse,
        },
      },
    },
    401: unauthorizedResponse,
    500: serverErrorResponse,
  },
});

registry.registerPath({
  path: "/users/{userId}/followers",
  method: "post",
  tags: ["users"],
  description: "Follows target user.",
  security,
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
  tags: ["users"],
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
  tags: ["users"],
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
  tags: ["users"],
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
