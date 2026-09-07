import { clientError, serverError } from "#src/schemas/errors/errors.js";

export const unauthorizedResponse = {
  summary: "Unauthorized",
  description: "Access token is missing or invalid.",
  content: {
    "application/json": {
      schema: clientError,
    },
  },
} as const;

export const serverErrorResponse = {
  summary: "Internal server error.",
  description: "Unexpected error occurred.",
  content: {
    "application/json": {
      schema: serverError,
    },
  },
} as const;
