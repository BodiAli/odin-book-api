import z from "zod";
import {
  createReplyRequest,
  getCommentRepliesResponse,
  getNumberOfCommentLikesResponse,
  updateCommentRequest,
} from "#src/schemas/routes/comments.js";
import { clientError } from "#src/schemas/errors/errors.js";
import { security } from "../common/security.js";
import registry from "../registry.js";
import {
  InsufficientPermissionResponse,
  invalidContentTypeResponse,
  invalidInputsResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "../common/responses.js";

registry.registerPath({
  path: "/comments/{commentId}",
  method: "patch",
  description: "Update comment.",
  security,
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCommentRequest,
        },
      },
    },
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    204: {
      summary: "No content",
      description: "Comment updated successfully",
    },
    400: invalidInputsResponse,
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Comment not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    415: invalidContentTypeResponse,
    500: serverErrorResponse,
  },
});

registry.registerPath({
  path: "/comments/{commentId}",
  method: "delete",
  description: "Delete comment.",
  security,
  request: {
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    204: {
      summary: "No content",
      description: "Comment deleted successfully",
    },
    400: invalidInputsResponse,
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Comment not found.",
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
  path: "/comments/{commentId}/replies",
  method: "get",
  tags: ["comments"],
  description: "Get comment replies.",
  security,
  request: {
    query: z.object({
      last_cursor_id: z.string().optional(),
    }),
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    200: {
      summary: "OK",
      description: "Comment replies retrieved successfully.",
      content: {
        "application/json": {
          schema: getCommentRepliesResponse,
        },
      },
    },
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "Comment not found.",
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
  path: "/comments/{commentId}/replies",
  method: "post",
  description: "Create reply.",
  security,
  request: {
    body: {
      content: {
        "application/json": {
          schema: createReplyRequest,
        },
      },
    },
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    201: {
      summary: "Created",
      description: "Reply created successfully.",
    },
    400: invalidInputsResponse,
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Comment not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    415: invalidContentTypeResponse,
    500: serverErrorResponse,
  },
});

registry.registerPath({
  path: "/comments/{commentId}/likes",
  method: "post",
  description: "Like comment.",
  security,
  request: {
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    204: {
      summary: "No content",
      description: "Comment liked successfully.",
    },
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "No comment found to like.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    409: {
      summary: "Conflict",
      description: "Comment is already liked by the current user.",
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
  path: "/comments/{commentId}/likes",
  method: "get",
  description: "Get number of comment likes.",
  security,
  request: {
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    200: {
      summary: "OK",
      description: "Number of comment likes fetched successfully.",
      content: {
        "application/json": {
          schema: getNumberOfCommentLikesResponse,
        },
      },
    },
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "Comment not found.",
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
  path: "/comments/{commentId}/likes",
  method: "delete",
  description: "Unlike comment.",
  security,
  request: {
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    204: {
      summary: "No content",
      description: "Comment unliked successfully.",
    },
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Comment or like were not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: serverErrorResponse,
  },
});
