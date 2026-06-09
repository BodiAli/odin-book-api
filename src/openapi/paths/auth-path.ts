import { clientError, serverError } from "#src/schemas/error-schemas.js";
import { signUpRequestBody, signUpResponseBody } from "#src/schemas/sign-up.js";
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
      summary: "Account created",
      description: "User signed up and created an account successfully",
      content: {
        "application/json": {
          schema: signUpResponseBody,
        },
      },
    },
    "400": {
      summary: "Invalid inputs",
      description: "User entered invalid inputs",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "409": {
      summary: "Conflict with existing data",
      description: "User entered an existing username or email",
      content: {
        "application/json": {
          schema: clientError,
        },
      },
    },
    "500": {
      summary: "Internal server error",
      description: "Unexpected error occurred",
      content: {
        "application/json": {
          schema: serverError,
        },
      },
    },
  },
});
