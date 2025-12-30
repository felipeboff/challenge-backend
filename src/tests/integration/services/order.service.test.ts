import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BadRequestError, NotFoundError } from "../../../shared/app-error";
import { PasswordHash } from "../../../shared/password-hash";
import { OrderModel } from "../../../database/models/order.model";
import { UserModel } from "../../../database/models/user.model";
import { OrderService } from "../../../modules/orders/order.service";
import { OrderRepository } from "../../../modules/orders/order.repository";
import {
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
} from "../../../modules/orders/order.type";
import { UserRepository } from "../../../modules/users/user.repository";
import { UserService } from "../../../modules/users/user.service";
import type { IUser } from "../../../modules/users/user.type";
import {
  createMockOrderInput,
  createMockServiceInput,
} from "../../mocks/order.mock";
import { createMockUserInput } from "../../mocks/user.mock";

describe("OrderService - Integration Tests", () => {
  let orderService: OrderService;
  let orderRepository: OrderRepository;
  let userService: UserService;
  let userRepository: UserRepository;
  let passwordHash: PasswordHash;

  // Helper function to create a user for testing
  async function createTestUser(): Promise<IUser> {
    const userInput = createMockUserInput();
    const hashedPassword = await passwordHash.hash(userInput.password);
    const now = new Date();

    const userData: IUser = {
      id: new Types.ObjectId(),
      email: userInput.email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await userRepository.create(userData);
    return createdUser;
  }

  beforeEach(async () => {
    // Initialize real instances (no mocks)
    passwordHash = new PasswordHash();
    userRepository = new UserRepository(UserModel);
    userService = new UserService(userRepository, passwordHash);
    orderRepository = new OrderRepository(OrderModel);
    orderService = new OrderService(orderRepository);

    // Clean up database before each test
    await OrderModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  afterEach(async () => {
    // Clean up database after each test
    await OrderModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  describe("createOrder", () => {
    it("should create an order successfully", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const result = await orderService.createOrder(orderInput, user);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("labName", orderInput.labName);
      expect(result).toHaveProperty("patientName", orderInput.patientName);
      expect(result).toHaveProperty("clinicName", orderInput.clinicName);
      expect(result).toHaveProperty("stage", ENUMOrderStage.CREATED);
      expect(result).toHaveProperty("status", ENUMOrderStatus.ACTIVE);
      expect(result).toHaveProperty("userId", user.id);
      expect(result).toHaveProperty("services");
      expect(result.services).toHaveLength(orderInput.services.length);
      expect(result.services[0]).toHaveProperty(
        "status",
        ENUMOrderServiceStatus.PENDING
      );

      // Verify order was saved in database
      const orderInDb = await OrderModel.findById(result.id).lean();
      expect(orderInDb).toBeTruthy();
      expect(orderInDb?.labName).toBe(orderInput.labName);
      expect(orderInDb?.userId.toString()).toBe(user.id.toString());
    });

    it("should throw BadRequestError when services array is empty", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput({ services: [] });

      await expect(orderService.createOrder(orderInput, user)).rejects.toThrow(
        BadRequestError
      );
      await expect(orderService.createOrder(orderInput, user)).rejects.toThrow(
        "Services are required"
      );
    });

    it("should throw BadRequestError when total value is zero or negative", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput({
        services: [createMockServiceInput({ value: 0 })],
      });

      await expect(orderService.createOrder(orderInput, user)).rejects.toThrow(
        BadRequestError
      );
      await expect(orderService.createOrder(orderInput, user)).rejects.toThrow(
        "Total value of services must be greater than 0"
      );
    });

    it("should create multiple orders for the same user", async () => {
      const user = await createTestUser();
      const orderInput1 = createMockOrderInput();
      const orderInput2 = createMockOrderInput();

      const result1 = await orderService.createOrder(orderInput1, user);
      const result2 = await orderService.createOrder(orderInput2, user);

      expect(result1.id).not.toEqual(result2.id);
      expect(result1.userId).toEqual(user.id);
      expect(result2.userId).toEqual(user.id);

      // Verify both orders exist in database
      const ordersCount = await OrderModel.countDocuments({ userId: user.id });
      expect(ordersCount).toBe(2);
    });

    it("should set all services with PENDING status by default", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput({
        services: [
          createMockServiceInput(),
          createMockServiceInput(),
          createMockServiceInput(),
        ],
      });

      const result = await orderService.createOrder(orderInput, user);

      expect(result.services).toHaveLength(3);
      result.services.forEach((service) => {
        expect(service.status).toBe(ENUMOrderServiceStatus.PENDING);
      });
    });
  });

  describe("getOrderById", () => {
    it("should return order when found and belongs to user", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);
      const result = await orderService.getOrderById(createdOrder.id, user);

      expect(result.id).toEqual(createdOrder.id);
      expect(result.labName).toBe(orderInput.labName);
      expect(result.userId).toEqual(user.id);
    });

    it("should throw NotFoundError when order does not exist", async () => {
      const user = await createTestUser();
      const fakeOrderId = new Types.ObjectId();

      await expect(
        orderService.getOrderById(fakeOrderId, user)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.getOrderById(fakeOrderId, user)
      ).rejects.toThrow("Order not found");
    });

    it("should throw NotFoundError when order belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user1);

      // Try to get order with different user
      await expect(
        orderService.getOrderById(createdOrder.id, user2)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.getOrderById(createdOrder.id, user2)
      ).rejects.toThrow("Order not found");
    });
  });

  describe("getOrders", () => {
    it("should return paginated orders for user", async () => {
      const user = await createTestUser();

      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        await orderService.createOrder(createMockOrderInput(), user);
      }

      const result = await orderService.getOrders(user, {
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty("orders");
      expect(result).toHaveProperty("total", 5);
      expect(result).toHaveProperty("page", 1);
      expect(result).toHaveProperty("limit", 10);
      expect(result).toHaveProperty("totalPages", 1);
      expect(result).toHaveProperty("hasNextPage", false);
      expect(result).toHaveProperty("hasPreviousPage", false);
      expect(result.orders).toHaveLength(5);
      result.orders.forEach((order) => {
        expect(order.userId).toEqual(user.id);
      });
    });

    it("should only return orders for the authenticated user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      // Create orders for both users
      await orderService.createOrder(createMockOrderInput(), user1);
      await orderService.createOrder(createMockOrderInput(), user1);
      await orderService.createOrder(createMockOrderInput(), user2);

      const result = await orderService.getOrders(user1, {
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(2);
      expect(result.orders).toHaveLength(2);
      result.orders.forEach((order) => {
        expect(order.userId).toEqual(user1.id);
      });
    });

    it("should filter orders by stage", async () => {
      const user = await createTestUser();

      const order1 = await orderService.createOrder(
        createMockOrderInput(),
        user
      );
      await orderService.advanceOrderStage(order1.id, user);
      await orderService.createOrder(createMockOrderInput(), user);

      const result = await orderService.getOrders(user, {
        page: 1,
        limit: 10,
        stage: ENUMOrderStage.CREATED,
      });

      expect(result.total).toBe(1);
      expect(result.orders[0].stage).toBe(ENUMOrderStage.CREATED);
    });

    it("should handle pagination correctly", async () => {
      const user = await createTestUser();

      // Create 5 orders
      for (let i = 0; i < 5; i++) {
        await orderService.createOrder(createMockOrderInput(), user);
      }

      const page1 = await orderService.getOrders(user, {
        page: 1,
        limit: 2,
      });

      expect(page1.orders).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.hasNextPage).toBe(true);
      expect(page1.hasPreviousPage).toBe(false);

      const page2 = await orderService.getOrders(user, {
        page: 2,
        limit: 2,
      });

      expect(page2.orders).toHaveLength(2);
      expect(page2.total).toBe(5);
      expect(page2.hasNextPage).toBe(true);
      expect(page2.hasPreviousPage).toBe(true);
    });
  });

  describe("updateOrder", () => {
    it("should update order successfully", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);

      const updateData = {
        labName: "Updated Lab Name",
        patientName: "Updated Patient Name",
        clinicName: createdOrder.clinicName,
        expiresAt: createdOrder.expiresAt,
        services: createdOrder.services,
      };

      const result = await orderService.updateOrder(
        createdOrder.id,
        user,
        updateData
      );

      expect(result.labName).toBe("Updated Lab Name");
      expect(result.patientName).toBe("Updated Patient Name");
      expect(result.id).toEqual(createdOrder.id);

      // Verify order was updated in database
      const orderInDb = await OrderModel.findById(createdOrder.id).lean();
      expect(orderInDb?.labName).toBe("Updated Lab Name");
    });

    it("should throw NotFoundError when order does not exist", async () => {
      const user = await createTestUser();
      const fakeOrderId = new Types.ObjectId();

      await expect(
        orderService.updateOrder(fakeOrderId, user, {
          labName: "Updated",
        } as any)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when order belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user1);

      await expect(
        orderService.updateOrder(createdOrder.id, user2, {
          labName: "Updated",
        } as any)
      ).rejects.toThrow(NotFoundError);
    });

    it("should update services in order", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput({
        services: [
          createMockServiceInput({ name: "Service 1", value: 100 }),
          createMockServiceInput({ name: "Service 2", value: 200 }),
        ],
      });

      const createdOrder = await orderService.createOrder(orderInput, user);

      const updatedServices = [
        {
          ...createdOrder.services[0],
          name: "Updated Service 1",
          value: 150,
        },
        {
          ...createdOrder.services[1],
          value: 250,
        },
      ];

      const result = await orderService.updateOrder(createdOrder.id, user, {
        ...createdOrder,
        services: updatedServices,
      } as any);

      expect(result.services[0].name).toBe("Updated Service 1");
      expect(result.services[0].value).toBe(150);
      expect(result.services[1].value).toBe(250);
    });

    it("should throw BadRequestError when total value is zero or negative", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);

      const updatedServices = [
        {
          ...createdOrder.services[0],
          value: 0,
        },
      ];

      await expect(
        orderService.updateOrder(createdOrder.id, user, {
          ...createdOrder,
          services: updatedServices,
        } as any)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.updateOrder(createdOrder.id, user, {
          ...createdOrder,
          services: updatedServices,
        } as any)
      ).rejects.toThrow("Total value of services must be greater than 0");
    });
  });

  describe("advanceOrderStage", () => {
    it("should advance order stage from CREATED to ANALYSIS", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);
      expect(createdOrder.stage).toBe(ENUMOrderStage.CREATED);

      const result = await orderService.advanceOrderStage(
        createdOrder.id,
        user
      );

      expect(result.stage).toBe(ENUMOrderStage.ANALYSIS);
      expect(result.id).toEqual(createdOrder.id);

      // Verify stage was updated in database
      const orderInDb = await OrderModel.findById(createdOrder.id).lean();
      expect(orderInDb?.stage).toBe(ENUMOrderStage.ANALYSIS);
    });

    it("should advance order stage from ANALYSIS to COMPLETED", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);

      // Advance to ANALYSIS
      const analysisOrder = await orderService.advanceOrderStage(
        createdOrder.id,
        user
      );
      expect(analysisOrder.stage).toBe(ENUMOrderStage.ANALYSIS);

      // Advance to COMPLETED
      const completedOrder = await orderService.advanceOrderStage(
        createdOrder.id,
        user
      );
      expect(completedOrder.stage).toBe(ENUMOrderStage.COMPLETED);
    });

    it("should throw BadRequestError when order is already in final stage", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);

      // Advance to ANALYSIS
      await orderService.advanceOrderStage(createdOrder.id, user);
      // Advance to COMPLETED
      await orderService.advanceOrderStage(createdOrder.id, user);

      // Try to advance again
      await expect(
        orderService.advanceOrderStage(createdOrder.id, user)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.advanceOrderStage(createdOrder.id, user)
      ).rejects.toThrow("Cannot advance from stage completed");
    });

    it("should throw NotFoundError when order does not exist", async () => {
      const user = await createTestUser();
      const fakeOrderId = new Types.ObjectId();

      await expect(
        orderService.advanceOrderStage(fakeOrderId, user)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when order belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user1);

      await expect(
        orderService.advanceOrderStage(createdOrder.id, user2)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("createService", () => {
    it("should create a service in an order successfully", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);
      const initialServicesCount = createdOrder.services.length;

      const serviceInput = createMockServiceInput();
      const result = await orderService.createService(
        createdOrder.id,
        user,
        serviceInput
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name", serviceInput.name);
      expect(result).toHaveProperty("value", serviceInput.value);
      expect(result).toHaveProperty("status", ENUMOrderServiceStatus.PENDING);

      // Verify service was added to order
      const updatedOrder = await orderService.getOrderById(
        createdOrder.id,
        user
      );
      expect(updatedOrder.services).toHaveLength(initialServicesCount + 1);
    });

    it("should throw NotFoundError when order does not exist", async () => {
      const user = await createTestUser();
      const fakeOrderId = new Types.ObjectId();
      const serviceInput = createMockServiceInput();

      await expect(
        orderService.createService(fakeOrderId, user, serviceInput)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when order belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user1);
      const serviceInput = createMockServiceInput();

      await expect(
        orderService.createService(createdOrder.id, user2, serviceInput)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateService", () => {
    it("should update a service successfully", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);
      const serviceId = createdOrder.services[0].id;

      const updateData = {
        name: "Updated Service Name",
        value: 999.99,
      };

      const result = await orderService.updateService(
        createdOrder.id,
        serviceId,
        user,
        updateData
      );

      expect(result.id).toEqual(serviceId);
      expect(result.name).toBe("Updated Service Name");
      expect(result.value).toBe(999.99);

      // Verify service was updated in order
      const updatedOrder = await orderService.getOrderById(
        createdOrder.id,
        user
      );
      const updatedService = updatedOrder.services.find((s) =>
        s.id.equals(serviceId)
      );
      expect(updatedService?.name).toBe("Updated Service Name");
      expect(updatedService?.value).toBe(999.99);
    });

    it("should update service status", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);
      const serviceId = createdOrder.services[0].id;

      const result = await orderService.updateService(
        createdOrder.id,
        serviceId,
        user,
        { status: ENUMOrderServiceStatus.DONE }
      );

      expect(result.status).toBe(ENUMOrderServiceStatus.DONE);
    });

    it("should throw NotFoundError when order does not exist", async () => {
      const user = await createTestUser();
      const fakeOrderId = new Types.ObjectId();
      const fakeServiceId = new Types.ObjectId();

      await expect(
        orderService.updateService(fakeOrderId, fakeServiceId, user, {
          name: "Updated",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when service does not exist", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);
      const fakeServiceId = new Types.ObjectId();

      await expect(
        orderService.updateService(createdOrder.id, fakeServiceId, user, {
          name: "Updated",
        })
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.updateService(createdOrder.id, fakeServiceId, user, {
          name: "Updated",
        })
      ).rejects.toThrow("Service not found");
    });

    it("should throw NotFoundError when order belongs to another user", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user1);
      const serviceId = createdOrder.services[0].id;

      await expect(
        orderService.updateService(createdOrder.id, serviceId, user2, {
          name: "Updated",
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Integration scenarios", () => {
    it("should create order, add service, update service, and advance stage", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      // Create order
      const order = await orderService.createOrder(orderInput, user);
      expect(order.stage).toBe(ENUMOrderStage.CREATED);

      // Add service
      const newService = await orderService.createService(
        order.id,
        user,
        createMockServiceInput()
      );
      expect(newService.status).toBe(ENUMOrderServiceStatus.PENDING);

      // Update service
      const updatedService = await orderService.updateService(
        order.id,
        newService.id,
        user,
        { status: ENUMOrderServiceStatus.DONE }
      );
      expect(updatedService.status).toBe(ENUMOrderServiceStatus.DONE);

      // Advance stage
      const advancedOrder = await orderService.advanceOrderStage(
        order.id,
        user
      );
      expect(advancedOrder.stage).toBe(ENUMOrderStage.ANALYSIS);

      // Verify final state
      const finalOrder = await orderService.getOrderById(order.id, user);
      expect(finalOrder.stage).toBe(ENUMOrderStage.ANALYSIS);
      expect(finalOrder.services).toHaveLength(orderInput.services.length + 1);
      const service = finalOrder.services.find((s) =>
        s.id.equals(newService.id)
      );
      expect(service?.status).toBe(ENUMOrderServiceStatus.DONE);
    });

    it("should maintain data consistency across multiple operations", async () => {
      const user = await createTestUser();
      const orderInput = createMockOrderInput();

      const createdOrder = await orderService.createOrder(orderInput, user);

      // Update order
      const updatedOrder = await orderService.updateOrder(
        createdOrder.id,
        user,
        {
          labName: "Updated Lab",
          patientName: createdOrder.patientName,
          clinicName: createdOrder.clinicName,
          expiresAt: createdOrder.expiresAt,
          services: createdOrder.services,
        }
      );

      // Get order by ID
      const retrievedOrder = await orderService.getOrderById(
        createdOrder.id,
        user
      );

      // All should have same ID and updated labName
      expect(updatedOrder.id).toEqual(createdOrder.id);
      expect(retrievedOrder.id).toEqual(createdOrder.id);
      expect(updatedOrder.labName).toBe("Updated Lab");
      expect(retrievedOrder.labName).toBe("Updated Lab");
    });
  });
});
