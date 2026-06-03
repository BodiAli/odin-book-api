import "dotenv/config";
import express from "express";
import indexRouter from "./routes/index-router.js";
import openapiRouter from "./routes/openapi-router.js";

const app = express();

app.use("/", indexRouter);
app.use("/api-docs", openapiRouter);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${String(PORT)}.`);
});
