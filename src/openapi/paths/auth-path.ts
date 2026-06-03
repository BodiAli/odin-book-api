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
  },
});
