import "dotenv/config";
import express from "express";
import resourceNotFound from "#src/middlewares/resource-not-found.js";
import indexRouter from "./routes/index-router.js";
import openapiRouter from "./routes/openapi-router.js";
import genericErrorHandler from "./middlewares/generic-error-handler.js";

const app = express();

app.use("/", indexRouter);
app.use("/api-docs", openapiRouter);

app.use(resourceNotFound);
app.use(genericErrorHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${String(PORT)}.`);
});
