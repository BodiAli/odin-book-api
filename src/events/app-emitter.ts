import { EventEmitter } from "node:events";
import sendNotification from "#src/services/send-notification.js";
import type { NotificationModel } from "#src/types/routes/notifications.js";

class AppEmitter {
  #appEmitter: EventEmitter;
  private static instance: AppEmitter | null = null;

  private constructor() {
    this.#appEmitter = new EventEmitter();
    if (AppEmitter.instance) {
      throw new Error(
        "Use AppEmitter.getInstance() to get the appEmitter instance.",
      );
    }
    AppEmitter.instance = this;
  }

  static getInstance(): AppEmitter {
    this.instance ??= new this();
    return this.instance;
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

export default AppEmitter;
