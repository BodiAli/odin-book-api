import registry from "../registry.js";

registry.registerComponent("securitySchemes", "bearerHttpAuthorization", {
  type: "http",
  bearerFormat: "JWT",
  description: "Bearer token using a JWT",
  scheme: "Bearer",
});
