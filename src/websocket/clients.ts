import type WebSocket from "ws";

class Clients {
  #clients = new Map<string, WebSocket[]>();

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

  get clients(): WebSocket[] {
    return this.#clients.values().toArray().flat();
  }

  createUserConnection(id: string): void {
    if (this.#clients.has(id)) {
      throw new Error("User already has a connection established.");
    }
    this.#clients.set(id, []);
  }

  getUserClients(id: string): WebSocket[] {
    const userClients = this.#clients.get(id);
    if (!userClients) {
      throw new Error("No user connection is found.");
    }

    return userClients;
  }

  insertClient(id: string, ws: WebSocket): boolean {
    const user = this.getUserClients(id);
    user.push(ws);
    return true;
  }

  hasConnection(id: string): boolean {
    const userClients = this.#clients.get(id);

    if (!userClients) {
      return false;
    }

    return userClients.length !== 0;
  }
}

export default Clients;
