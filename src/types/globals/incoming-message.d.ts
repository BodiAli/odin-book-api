declare module "node:http" {
  interface IncomingMessage {
    userId: string;
  }
}
