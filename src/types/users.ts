import type { user } from "#src/schemas/user-schema.js";
import type { z } from "zod";

export type User = z.infer<typeof user>;
