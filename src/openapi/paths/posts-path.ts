import z from "zod";
import { clientError } from "#src/schemas/errors/errors.js";
import {
  createPostCommentResponse,
  createPostRequestBody,
  createPostResponseBody,
  getIndexPostsResponseBody,
  getPostCommentsResponse,
  post,
  updatePostRequestBody,
} from "#src/schemas/routes/posts.js";
import { createCommentRequest } from "#src/schemas/routes/comments.js";
import addBinaryField from "../common/multipart-schema.js";
import {
  InsufficientPermissionResponse,
  invalidContentTypeResponse,
  invalidInputsResponse,
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
        "multipart/form-data": {
          schema: addBinaryField(createPostRequestBody, "postImage", false),
          encoding: {
            postImage: {
              contentType: "image/*",
            },
          },
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
      headers: z.object({
        location: z.string(),
      }),
    },
    400: invalidInputsResponse,
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    415: invalidContentTypeResponse,
    502: {
      summary: "Bad gateway",
      description: "Server received an unexpected response from Cloudinary.",
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

registry.registerPath({
  path: "/posts/{postId}",
  method: "get",
  tags: ["posts"],
  description: "Get a post.",
  security,
  parameters: [
    {
      in: "path",
      name: "postId",
      required: true,
      schema: {
        type: "string",
      },
    },
  ],
  responses: {
    200: {
      summary: "OK",
      description: "Post fetched successfully.",
      content: {
        "application/json": {
          schema: post,
        },
      },
    },
    404: {
      summary: "Not found",
      description: "Post not found.",
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

registry.registerPath({
  path: "/posts/{postId}",
  method: "patch",
  tags: ["posts"],
  description: "Update post",
  parameters: [
    {
      in: "path",
      name: "postId",
      required: true,
      schema: {
        type: "string",
      },
    },
  ],
  security,
  request: {
    body: {
      content: {
        "application/json": {
          schema: updatePostRequestBody,
        },
        "multipart/form-data": {
          schema: addBinaryField(updatePostRequestBody, "postImage", false),
          encoding: {
            postImage: {
              contentType: "image/*",
            },
          },
        },
      },
    },
  },
  responses: {
    204: {
      summary: "No content",
      description: "Post updated successfully.",
    },
    400: invalidInputsResponse,
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Post not found.",
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
  path: "/posts/{postId}",
  method: "delete",
  tags: ["posts"],
  description: "Delete post",
  security,
  responses: {
    204: {
      summary: "No content",
      description: "Post deleted successfully.",
    },
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Post not found.",
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
  path: "/posts/{postId}/comments",
  method: "get",
  tags: ["posts"],
  description: "Get post comments.",
  security,
  request: {
    query: z.object({
      last_cursor_id: z.string().optional(),
    }),
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    200: {
      summary: "OK",
      description: "Post comments retrieved successfully.",
      content: {
        "application/json": {
          schema: getPostCommentsResponse,
        },
      },
    },
    401: unauthorizedResponse,
    404: {
      summary: "Not found",
      description: "Post not found.",
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
  path: "/posts/{postId}/comments",
  method: "post",
  tags: ["posts"],
  description: "Create comment in post.",
  security,
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCommentRequest,
        },
      },
    },
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    201: {
      summary: "Created",
      description: "Post comment created successfully.",
      content: {
        "application/json": {
          schema: createPostCommentResponse,
        },
      },
    },
    400: invalidInputsResponse,
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Post not found.",
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
  path: "/posts/{postId}/likes",
  method: "post",
  description: "Like post.",
  security,
  request: {
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    204: {
      summary: "No content",
      description: "Post liked successfully.",
    },
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "No post found to like.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    409: {
      summary: "Conflict",
      description: "Post is already liked by the current user.",
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
  path: "/posts/{postId}/likes",
  method: "delete",
  description: "Unlike post.",
  security,
  request: {
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    204: {
      summary: "No content",
      description: "Post unliked successfully.",
    },
    401: unauthorizedResponse,
    403: InsufficientPermissionResponse,
    404: {
      summary: "Not found",
      description: "Post or like were not found.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    500: serverErrorResponse,
  },
});
