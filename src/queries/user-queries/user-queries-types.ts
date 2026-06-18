import type { Provider } from "#src/generated/prisma/enums.js";

export interface CreateUserArguments {
  email: string;
  fullName: string;
  password: string | null;
  provider?: Provider;
}
