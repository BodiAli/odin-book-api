import type WebSocket from "ws";

class Clients {
  #clients = new Map<string, WebSocket>();

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

export default new Clients();
