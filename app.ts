import "dotenv/config";
import express from "express";
import cors from "cors";
import indexRouter from "./src/routes/index-router.ts";

const app = express();

// app.use(cors());

app.use("/", indexRouter);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${String(PORT)}.`);
});
