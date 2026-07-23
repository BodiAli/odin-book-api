import type { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  res.status(500);
  res.json({ error: Error.isError(err) ? err.message : String(err) });
};

export default errorHandler;
