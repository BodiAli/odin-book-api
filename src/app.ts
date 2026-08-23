import "dotenv/config";
import express from "express";
import cors from "cors";
import indexRouter from "./routes/index-router.js";
import openapiRouter from "./routes/openapi-router.js";
import resourceNotFound from "./errors/resource-not-found.js";
import errorHandler from "./errors/error-handler.js";

const app = express();

app.disable("x-powered-by");

app.use(cors());

app.use(indexRouter);
app.use("/api-docs", openapiRouter);

app.use(resourceNotFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${String(PORT)}.`);
});
