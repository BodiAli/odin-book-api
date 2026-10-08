import { clientError } from "#src/schemas/errors/errors.js";
import {
  createPostRequestBody,
  createPostResponseBody,
  getIndexPostsResponseBody,
  post,
} from "#src/schemas/routes/posts.js";
import addBinaryField from "../common/multipart-schema.js";
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
    },
    401: unauthorizedResponse,
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
