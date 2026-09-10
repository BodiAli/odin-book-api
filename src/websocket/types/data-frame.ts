import type { EventTypes } from "./event-type.js";

export interface DataFrame {
  success: boolean;
  type: EventTypes;
  data: {
    message: string;
  };
}
