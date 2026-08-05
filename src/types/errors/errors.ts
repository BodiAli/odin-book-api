import type { clientError, serverError } from "#src/schemas/errors/errors.js";
import type { z } from "zod";

export type ClientError = z.infer<typeof clientError>;
export type ServerError = z.infer<typeof serverError>;
