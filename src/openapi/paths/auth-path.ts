import { clientError, serverError } from "#src/schemas/error-schemas.js";
import {
  authenticatedResponse,
  logInRequestBody,
  oauth2RequestBody,
  signUpRequestBody,
} from "#src/schemas/auth.js";
import registry from "../registry.js";

registry.registerPath({
  method: "post",
  path: "/auth/sign-up",
  tags: ["auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: signUpRequestBody,
          example: {
            email: "user@example.com",
            username: "username-no-whitespace",
            fullName: "First-name Last-name",
            password: "user-password",
            confirmPassword: "user-password",
          },
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
    "400": {
      summary: "Invalid inputs.",
      description: "User entered invalid inputs.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "500": {
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
  method: "post",
  path: "/auth/log-in",
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
    "400": {
      summary: "Invalid inputs.",
      description: "User entered invalid inputs.",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "500": {
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
  method: "post",
  path: "/auth/google",
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
  method: "post",
  path: "/auth/github",
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
      description: "Server received an unexpected response Github.",
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
  method: "post",
  path: "/auth/guest",
  tags: ["auth"],
  responses: {
    200: {
      description: "Successfully signing in as a guest.",
      summary: "OK",
      content: {
        "application/json": {
          schema: authenticatedResponse,
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
