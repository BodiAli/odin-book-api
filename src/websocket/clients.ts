import type WebSocket from "ws";

class Clients {
  #clients = new Map<string, WebSocket>();

  private static instance: Clients | null = null;
  constructor() {
    if (Clients.instance !== null) {
      throw new Error("Use Clients.getInstance() to get the clients instance.");
    }
    Clients.instance = this;
  }

  static getInstance(): Clients {
    this.instance ??= new this();
    return this.instance;
  }

  get clients(): Map<string, WebSocket> {
    return this.#clients;
  }

  getClient(id: string): WebSocket | undefined {
    const ws = this.#clients.get(id);
    return ws;
  }

  insertClient(ws: WebSocket): void {
    this.#clients.set(ws.id, ws);
  }
}

export default Clients;
