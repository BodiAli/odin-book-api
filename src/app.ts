import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import indexRouter from "./routes/index-router.js";
import openapiRouter from "./routes/openapi-router.js";
import resourceNotFound from "./errors/resource-not-found.js";
import errorHandler from "./errors/error-handler.js";
import config from "./config/config.js";
import webSocketApp from "./websocket/index.js";

const app = express();
const server = http.createServer(app);

new webSocketApp().serverUpgrade(server);

app.disable("x-powered-by");

app.use(cors());

app.use(indexRouter);
app.use("/api-docs", openapiRouter);

app.use(resourceNotFound);
app.use(errorHandler);

server.listen(config.port, () => {
  console.log(`Server listening on port ${String(config.port)}.`);
});
