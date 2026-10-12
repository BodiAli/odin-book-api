import { clientError } from "#src/schemas/errors/errors.js";
import {
  authenticatedResponse,
  logInRequestBody,
  oauth2RequestBody,
} from "#src/schemas/routes/tokens.js";
import { serverErrorResponse } from "../common/responses.js";
import registry from "../registry.js";

registry.registerPath({
  method: "post",
  path: "/tokens/local",
  tags: ["auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: logInRequestBody,
        },
      },
    },
  },
  responses: {
    "200": {
      summary: "User authenticated.",
      description:
        "User entered valid inputs and is successfully authenticated.",
      content: {
        "application/json": {
          schema: authenticatedResponse,
        },
      },
    },
    "400": {
      summary: "Invalid inputs.",
      description: "User entered invalid inputs.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "401": {
      summary: "Invalid credentials.",
      description:
        "User entered credentials with the correct format but incorrect username or password.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "500": serverErrorResponse,
  },
});

registry.registerPath({
  method: "post",
  path: "/tokens/google",
  tags: ["auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: oauth2RequestBody,
        },
      },
    },
  },
  responses: {
    200: {
      summary: "OK",
      description:
        "Authorization code is exchanged successfully and user info is retrieved.",
      content: {
        "application/json": {
          schema: authenticatedResponse,
        },
      },
    },
    400: {
      summary: "Bad request",
      description:
        "Failed authorization due to invalid or expired authorization code.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    401: {
      summary: "Access denied",
      description: "User denied consent to authorize api to access their info.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    502: {
      summary: "Bad gateway",
      description: "Server received an unexpected response from Google.",
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
  method: "post",
  path: "/tokens/github",
  tags: ["auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: oauth2RequestBody,
        },
      },
    },
  },
  responses: {
    200: {
      summary: "OK",
      description:
        "Authorization code is exchanged successfully and user info is retrieved.",
      content: {
        "application/json": {
          schema: authenticatedResponse,
        },
      },
    },
    400: {
      summary: "Bad request",
      description: "Invalid code_verifier.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    401: {
      summary: "Access Denied",
      description: "User denied consent to authorize api to access their info.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    502: {
      summary: "Bad gateway",
      description: "Server received an unexpected response from Github.",
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
  method: "post",
  path: "/tokens/guest",
  tags: ["auth"],
  responses: {
    200: {
      summary: "OK",
      description: "Successfully signing in as a guest.",
      content: {
        "application/json": {
          schema: authenticatedResponse,
        },
      },
    },
    500: serverErrorResponse,
  },
});
