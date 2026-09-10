import { z } from "zod";
import { EventType } from "#src/types/websocket/event-type.js";

export const messageData = z.object({
  type: z.enum(EventType, "Invalid event type."),
  data: z
    .string("Please provide a string data.")
    .trim()
    .nonempty("Data cannot be empty."),
});
