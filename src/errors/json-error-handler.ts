import type { ClientError } from "#src/types/errors/errors.js";
import type { ErrorRequestHandler } from "express";

const jsonErrorHandler: ErrorRequestHandler<unknown, ClientError> = (
  err,
  _req,
  res,
  next,
): void => {
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    "type" in err &&
    err.status === 400 &&
    err.type === "entity.parse.failed"
  ) {
    res.status(err.status).json({ errors: [{ message: "Invalid JSON." }] });
    return;
  }

  next(err);
};

export default jsonErrorHandler;
