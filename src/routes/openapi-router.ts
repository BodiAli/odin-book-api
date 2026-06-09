import path from "node:path";
import { Router } from "express";
import * as swaggerUi from "swagger-ui-express";
import openapiDocument from "#src/generated/openapi/openapi.json" with { type: "json" };

const openapiRouter = Router();

openapiRouter.use("/", swaggerUi.serve);
openapiRouter.get("/", swaggerUi.setup(openapiDocument));
openapiRouter.get("/openapi.json", (_req, res) => {
  res.sendFile(
    path.resolve(import.meta.dirname, "../generated/openapi/openapi.json"),
  );
});

export default openapiRouter;
