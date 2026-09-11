import { z } from "zod";
import { events } from "#src/events/index.js";

export const clientMessageData = z.object({
  type: z.enum(events, "Invalid event type."),
  data: z
    .string("Please provide a string data.")
    .trim()
    .nonempty("Data cannot be empty."),
});
