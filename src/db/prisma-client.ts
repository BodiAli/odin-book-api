import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#src/generated/prisma/client.js";
import config from "#src/config/config.js";

const adapter = new PrismaPg({ connectionString: config.connectionString });
const prisma = new PrismaClient({
  adapter,
  omit: {
    user: {
      password: true,
    },
  },
});

export default prisma;
