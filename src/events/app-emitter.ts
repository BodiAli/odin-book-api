import { EventEmitter } from "node:events";
import sendNotification from "#src/services/send-notification.js";
import type { NotificationModel } from "#src/types/routes/notifications.js";

class AppEmitter {
  #appEmitter: EventEmitter;
  constructor() {
    this.#appEmitter = new EventEmitter();
  }

  listenForNotification(): void {
    this.#appEmitter.once("notification", this.notificationListener);
  }

  private async notificationListener(
    this: void,
    notification: NotificationModel,
  ): Promise<void> {
    await sendNotification(notification);
  }

  emitNotification(notification: NotificationModel): void {
    this.#appEmitter.emit("notification", notification);
  }
}

export default new AppEmitter();
