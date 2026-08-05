import fs from "node:fs/promises";
import path from "node:path";
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import registry from "./registry.js";
import "./components/security-scheme.js";
import "./paths/auth-path.js";
import "./paths/users-path.js";

const generator = new OpenApiGeneratorV31(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: "3.2.0",
  info: {
    title: "Odin Book API",
    version: "1.0.0",
    description: "API for the Odin Book website",
    license: {
      name: "MIT License",
    },
  },
  tags: [
    {
      name: "auth",
      description: "Authentication operations",
    },
    {
      name: "user-follow",
      description: "User follow operations",
    },
  ],
  servers: [{ url: "http://localhost:3000" }],
});

await fs.writeFile(
  path.join(process.cwd(), "src", "generated", "openapi", "openapi.json"),
  JSON.stringify(openApiDocument, null, 2),
);
