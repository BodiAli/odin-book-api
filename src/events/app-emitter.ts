import { EventEmitter } from "node:events";
import sendNotification from "#src/services/send-notification.js";

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
    this.#appEmitter.on("notification", this.notificationListener);
  }

  private async notificationListener(
    this: void,
    notifierId: string,
    notificationId: string,
  ): Promise<void> {
    try {
      await sendNotification(notifierId, notificationId);
    } catch (error) {
      console.error("Failed to send notification", error);
    }
  }

  emitNotification(notifierId: string, notificationId: string): void {
    this.#appEmitter.emit("notification", notifierId, notificationId);
  }
}

export default AppEmitter;
