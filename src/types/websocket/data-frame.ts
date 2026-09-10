import type { EventType } from "./event-type.js";

export interface DataFrame {
  success: boolean;
  type: EventType;
  data: {
    message: string;
  };
}
