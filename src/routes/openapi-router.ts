import { Router } from "express";
import * as swaggerUi from "swagger-ui-express";
import openapiDocument from "#src/generated/openapi/openapi.json" with { type: "json" };

const openapiRouter = Router();

openapiRouter.use("/", swaggerUi.serve);
openapiRouter.get("/", swaggerUi.setup(openapiDocument));

export default openapiRouter;
