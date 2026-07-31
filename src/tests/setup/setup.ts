import { afterEach } from "vitest";
import { resetTables } from "#src/generated/prisma/sql/resetTables.js";
import prisma from "#src/db/prisma-client.js";

afterEach(async () => {
  await prisma.$queryRawTyped(resetTables());
});
