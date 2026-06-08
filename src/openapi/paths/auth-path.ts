import * as errorSchemas from "#src/schemas/error-schemas.js";
import * as signUp from "#src/schemas/sign-up.js";
import registry from "../registry.js";

registry.registerPath({
  method: "post",
  path: "/auth/sign-up",
  tags: ["auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: signUp.RequestBody,
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
          schema: signUp.ResponseBody,
        },
      },
    },
    "400": {
      summary: "Invalid inputs",
      description: "User entered invalid inputs",
      content: {
        "application/json": {
          schema: errorSchemas.ClientError,
        },
      },
    },
    "409": {
      summary: "Conflict with existing data",
      description: "User entered an existing username or email",
      content: {
        "application/json": {
          schema: errorSchemas.ClientError,
        },
      },
    },
    "500": {
      summary: "Internal server error",
      description: "Unexpected error occurred",
      content: {
        "application/json": {
          schema: errorSchemas.ServerError,
        },
      },
    },
  },
});
