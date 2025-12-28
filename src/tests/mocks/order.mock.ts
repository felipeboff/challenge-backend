import { faker } from "@faker-js/faker";

import {
  CreateOrderInput,
  CreateServiceInput,
} from "../../modules/orders/order.schema";

export function createMockServiceInput(
  overrides?: Partial<CreateServiceInput>
): CreateServiceInput {
  return {
    name: faker.commerce.productName(),
    value: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    ...overrides,
  };
}

export function createMockOrderInput(
  overrides?: Partial<CreateOrderInput>
): CreateOrderInput {
  return {
    labName: faker.company.name(),
    patientName: faker.person.fullName(),
    clinicName: faker.company.name(),
    services: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
      createMockServiceInput()
    ),
    expiresAt: faker.date.future(),
    ...overrides,
  };
}
