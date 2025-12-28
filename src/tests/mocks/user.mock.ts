import { faker } from "@faker-js/faker";

import { RegisterInput } from "../../modules/auth/auth.schema";

export function createMockUserInput(
  overrides?: Partial<RegisterInput>
): RegisterInput {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,
  };
}
