import { faker } from "@faker-js/faker";
import { Types } from "mongoose";

import { OrderModel } from "../database/models/order.model";
import { UserModel } from "../database/models/user.model";
import {
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
  IOrder,
} from "../modules/orders/order.type";
import { IUser } from "../modules/users/user.type";
import { PasswordHash } from "../shared/password-hash";
import { createMockOrderInput } from "./mocks/order.mock";
import { createMockUserInput } from "./mocks/user.mock";
import { IUserDocument, toObjectUser } from "../modules/users/user.repository";
import {
  IOrderDocument,
  toObjectOrder,
} from "../modules/orders/order.repository";

export async function seedDatabase(): Promise<{
  users: IUser[];
  orders: IOrder[];
}> {
  const passwordHash = new PasswordHash();
  const users = await Promise.all(
    Array.from({ length: 3 }, async () => {
      const mockUser = createMockUserInput();
      const hashedPassword = await passwordHash.hash(mockUser.password);

      const user: IUserDocument = {
        ...mockUser,
        _id: new Types.ObjectId(),
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await UserModel.create(user);
      return toObjectUser(result.toObject());
    })
  );

  const orders = await Promise.all(
    users.flatMap((user) => {
      return Array.from(
        { length: faker.number.int({ min: 2, max: 4 }) },
        async () => {
          const mockOrder = createMockOrderInput();
          const order: IOrderDocument = {
            ...mockOrder,
            _id: new Types.ObjectId(),
            stage: faker.helpers.arrayElement(Object.values(ENUMOrderStage)),
            status: faker.helpers.arrayElement(Object.values(ENUMOrderStatus)),
            services: mockOrder.services.map((service) => ({
              ...service,
              _id: new Types.ObjectId(),
              status: faker.helpers.arrayElement(
                Object.values(ENUMOrderServiceStatus)
              ),
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await OrderModel.create(order);
          return toObjectOrder(result.toObject());
        }
      );
    })
  ).then((ordersArrays) => ordersArrays.flat());

  return { users: users.map(toObjectUser), orders: orders.map(toObjectOrder) };
}

export async function seedUser(
  email?: string,
  password?: string
): Promise<IUser> {
  const mockUser = createMockUserInput();
  const passwordHash = new PasswordHash();

  const hashedPassword = await passwordHash.hash(password || mockUser.password);
  const user: IUserDocument = {
    ...mockUser,
    email: email || mockUser.email,
    _id: new Types.ObjectId(),
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await UserModel.create(user);
  return toObjectUser(result.toObject());
}

export async function seedOrdersForUser(
  userId: Types.ObjectId,
  count: number = 3
): Promise<IOrder[]> {
  return Promise.all(
    Array.from({ length: count }, async () => {
      const mockOrder = createMockOrderInput();
      const order: IOrderDocument = {
        ...mockOrder,
        _id: new Types.ObjectId(),
        userId,
        stage: faker.helpers.arrayElement(Object.values(ENUMOrderStage)),
        status: faker.helpers.arrayElement(Object.values(ENUMOrderStatus)),
        services: mockOrder.services.map((service) => ({
          ...service,
          _id: new Types.ObjectId(),
          status: faker.helpers.arrayElement(
            Object.values(ENUMOrderServiceStatus)
          ),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await OrderModel.create(order);
      return toObjectOrder(result.toObject());
    })
  );
}
