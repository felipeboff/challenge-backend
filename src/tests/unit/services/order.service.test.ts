import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../../../shared/app-error";
import { OrderService } from "../../../modules/orders/order.service";
import type { OrderRepository } from "../../../modules/orders/order.repository";
import type {
  CreateOrderInput,
  CreateServiceInput,
  GetOrdersQueryInput,
  UpdateOrderInput,
  UpdateServiceInput,
} from "../../../modules/orders/order.schema";
import {
  ALLOWED_ORDER_STAGE_TRANSITIONS,
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
  IOrder,
  IOrderPagination,
  IOrderService,
  ORDER_STAGE_SEQUENCE,
} from "../../../modules/orders/order.type";
import type { IUser } from "../../../modules/users/user.type";
import {
  createMockOrderInput,
  createMockServiceInput,
} from "../../mocks/order.mock";

describe("OrderService - Unit Tests", () => {
  let orderService: OrderService;
  let mockOrderRepository: OrderRepository;
  let mockUser: IUser;

  beforeEach(() => {
    // Create mocks
    mockOrderRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAllPaginated: vi.fn(),
      update: vi.fn(),
      createService: vi.fn(),
      updateService: vi.fn(),
    } as unknown as OrderRepository;

    mockUser = {
      id: new Types.ObjectId(),
      email: "test@example.com",
      password: "hashed-password",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orderService = new OrderService(mockOrderRepository);
  });

  describe("createOrder", () => {
    it("should create an order successfully", async () => {
      const orderInput = createMockOrderInput();
      const orderId = new Types.ObjectId();
      const now = new Date();

      const mockCreatedOrder: IOrder = {
        id: orderId,
        ...orderInput,
        services: orderInput.services.map((service) => ({
          ...service,
          id: new Types.ObjectId(),
          status: ENUMOrderServiceStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })),
        userId: mockUser.id,
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderRepository.create).mockResolvedValue(mockCreatedOrder);

      const result = await orderService.createOrder(orderInput, mockUser);

      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(result.id).toEqual(orderId);
      expect(result.userId).toEqual(mockUser.id);
      expect(result.stage).toEqual(ENUMOrderStage.CREATED);
      expect(result.status).toEqual(ENUMOrderStatus.ACTIVE);
      expect(result.services).toHaveLength(orderInput.services.length);
      result.services.forEach((service) => {
        expect(service.status).toEqual(ENUMOrderServiceStatus.PENDING);
      });
    });

    it("should throw BadRequestError when services array is empty", async () => {
      const orderInput: CreateOrderInput = {
        ...createMockOrderInput(),
        services: [],
      };

      await expect(
        orderService.createOrder(orderInput, mockUser)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.createOrder(orderInput, mockUser)
      ).rejects.toThrow("Services are required");

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when total value is less than or equal to 0", async () => {
      const orderInput: CreateOrderInput = {
        ...createMockOrderInput(),
        services: [
          { name: "Service 1", value: 0 },
          { name: "Service 2", value: -10 },
        ],
      };

      await expect(
        orderService.createOrder(orderInput, mockUser)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.createOrder(orderInput, mockUser)
      ).rejects.toThrow("Total value of services must be greater than 0");

      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it("should assign PENDING status to all services", async () => {
      const orderInput = createMockOrderInput();
      const orderId = new Types.ObjectId();
      const now = new Date();

      const mockCreatedOrder: IOrder = {
        id: orderId,
        ...orderInput,
        services: orderInput.services.map((service) => ({
          ...service,
          id: new Types.ObjectId(),
          status: ENUMOrderServiceStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })),
        userId: mockUser.id,
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderRepository.create).mockResolvedValue(mockCreatedOrder);

      const result = await orderService.createOrder(orderInput, mockUser);

      result.services.forEach((service) => {
        expect(service.status).toEqual(ENUMOrderServiceStatus.PENDING);
      });
    });
  });

  describe("getOrderById", () => {
    it("should return order when found and user has access", async () => {
      const orderId = new Types.ObjectId();
      const now = new Date();
      const mockOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [],
        expiresAt: new Date(),
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById(orderId, mockUser);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockOrder);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const notFoundError = new NotFoundError("Order not found", {
        origin: "OrderRepository.findById",
      });

      vi.mocked(mockOrderRepository.findById).mockRejectedValue(notFoundError);

      await expect(
        orderService.getOrderById(orderId, mockUser)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.getOrderById(orderId, mockUser)
      ).rejects.toThrow("Order not found");

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
    });

    it("should throw NotFoundError when user does not have access to order", async () => {
      const orderId = new Types.ObjectId();
      const otherUserId = new Types.ObjectId();
      const now = new Date();
      const mockOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: otherUserId,
        services: [],
        expiresAt: new Date(),
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(mockOrder);

      await expect(
        orderService.getOrderById(orderId, mockUser)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.getOrderById(orderId, mockUser)
      ).rejects.toThrow("Order not found");

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
    });
  });

  describe("getOrders", () => {
    it("should return paginated orders", async () => {
      const query: GetOrdersQueryInput = {
        page: 1,
        limit: 10,
      };
      const now = new Date();
      const mockOrders: IOrder[] = [
        {
          id: new Types.ObjectId(),
          labName: "Test Lab 1",
          patientName: "Test Patient 1",
          clinicName: "Test Clinic 1",
          stage: ENUMOrderStage.CREATED,
          status: ENUMOrderStatus.ACTIVE,
          userId: mockUser.id,
          services: [],
          expiresAt: new Date(),
          createdAt: now,
          updatedAt: now,
        },
      ];

      const mockPagination: IOrderPagination = {
        orders: mockOrders,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      vi.mocked(mockOrderRepository.findAllPaginated).mockResolvedValue(
        mockPagination
      );

      const result = await orderService.getOrders(mockUser, query);

      expect(mockOrderRepository.findAllPaginated).toHaveBeenCalledWith(
        mockUser.id,
        query
      );
      expect(result).toEqual(mockPagination);
    });
  });

  describe("updateOrder", () => {
    it("should update order successfully", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt: new Date(),
        createdAt: now,
        updatedAt: now,
      };

      const updateInput: UpdateOrderInput = {
        labName: "Updated Lab",
        services: [
          {
            id: serviceId,
            name: "Updated Service",
            value: 150,
          },
        ],
      };

      const updatedOrder: IOrder = {
        ...existingOrder,
        ...updateInput,
        services: [
          {
            ...existingOrder.services[0],
            ...updateInput.services![0],
          },
        ],
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.update).mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrder(
        orderId,
        mockUser,
        updateInput
      );

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderRepository.update).toHaveBeenCalled();
      expect(result.labName).toEqual(updateInput.labName);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const notFoundError = new NotFoundError("Order not found", {
        origin: "OrderRepository.findById",
      });

      vi.mocked(mockOrderRepository.findById).mockRejectedValue(notFoundError);

      await expect(
        orderService.updateOrder(orderId, mockUser, { labName: "Updated" })
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not have access", async () => {
      const orderId = new Types.ObjectId();
      const otherUserId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: otherUserId,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateOrder(orderId, mockUser, { labName: "Updated" })
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when services is not provided", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateOrderInput = {
        labName: "Updated Lab",
        // services not provided
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow("Services not found");

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when service is not found in update", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const nonExistentServiceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateOrderInput = {
        services: [
          {
            id: nonExistentServiceId,
            name: "Updated Service",
            value: 150,
          },
        ],
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow("Service not found");

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when total value is less than or equal to 0", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateOrderInput = {
        services: [
          {
            id: serviceId,
            value: -50,
          },
        ],
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow("Total value of services must be greater than 0");

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when stage transition is invalid", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateOrderInput = {
        stage: ENUMOrderStage.COMPLETED, // Invalid transition from CREATED
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
          },
        ],
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow("Cannot transition from");

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should allow valid stage transition", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateOrderInput = {
        stage: ENUMOrderStage.ANALYSIS, // Valid transition from CREATED
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
          },
        ],
      };

      const updatedOrder: IOrder = {
        ...existingOrder,
        stage: ENUMOrderStage.ANALYSIS,
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.update).mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrder(
        orderId,
        mockUser,
        updateInput
      );

      expect(result.stage).toEqual(ENUMOrderStage.ANALYSIS);
    });

    it("should throw InternalServerError when update fails", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateOrderInput = {
        labName: "Updated Lab",
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
          },
        ],
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.update).mockResolvedValue(null!);

      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow(InternalServerError);
      await expect(
        orderService.updateOrder(orderId, mockUser, updateInput)
      ).rejects.toThrow("Failed to update order");
    });
  });

  describe("advanceOrderStage", () => {
    it("should advance order stage successfully", async () => {
      const orderId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const advancedOrder: IOrder = {
        ...existingOrder,
        stage: ENUMOrderStage.ANALYSIS,
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.update).mockResolvedValue(advancedOrder);

      const result = await orderService.advanceOrderStage(orderId, mockUser);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(result.stage).toEqual(ENUMOrderStage.ANALYSIS);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const notFoundError = new NotFoundError("Order not found", {
        origin: "OrderRepository.findById",
      });

      vi.mocked(mockOrderRepository.findById).mockRejectedValue(notFoundError);

      await expect(
        orderService.advanceOrderStage(orderId, mockUser)
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not have access", async () => {
      const orderId = new Types.ObjectId();
      const otherUserId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: otherUserId,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.advanceOrderStage(orderId, mockUser)
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when cannot advance from current stage", async () => {
      const orderId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.COMPLETED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.advanceOrderStage(orderId, mockUser)
      ).rejects.toThrow(BadRequestError);
      await expect(
        orderService.advanceOrderStage(orderId, mockUser)
      ).rejects.toThrow("Cannot advance from stage");

      expect(mockOrderRepository.update).not.toHaveBeenCalled();
    });

    it("should throw InternalServerError when update fails", async () => {
      const orderId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.update).mockResolvedValue(null!);

      await expect(
        orderService.advanceOrderStage(orderId, mockUser)
      ).rejects.toThrow(InternalServerError);
      await expect(
        orderService.advanceOrderStage(orderId, mockUser)
      ).rejects.toThrow("Failed to update order");
    });
  });

  describe("createService", () => {
    it("should create service successfully", async () => {
      const orderId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serviceInput: CreateServiceInput = createMockServiceInput();
      const serviceId = new Types.ObjectId();
      const now = new Date();

      const createdService: IOrderService = {
        ...serviceInput,
        id: serviceId,
        status: ENUMOrderServiceStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.createService).mockResolvedValue(
        createdService
      );

      const result = await orderService.createService(
        orderId,
        mockUser,
        serviceInput
      );

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderRepository.createService).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining({
          name: serviceInput.name,
          value: serviceInput.value,
          status: ENUMOrderServiceStatus.PENDING,
        })
      );
      expect(result).toEqual(createdService);
      expect(result.status).toEqual(ENUMOrderServiceStatus.PENDING);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const notFoundError = new NotFoundError("Order not found", {
        origin: "OrderRepository.findById",
      });
      const serviceInput: CreateServiceInput = createMockServiceInput();

      vi.mocked(mockOrderRepository.findById).mockRejectedValue(notFoundError);

      await expect(
        orderService.createService(orderId, mockUser, serviceInput)
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.createService).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not have access", async () => {
      const orderId = new Types.ObjectId();
      const otherUserId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: otherUserId,
        services: [],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serviceInput: CreateServiceInput = createMockServiceInput();

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.createService(orderId, mockUser, serviceInput)
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.createService).not.toHaveBeenCalled();
    });
  });

  describe("updateService", () => {
    it("should update service successfully", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt: new Date(),
        createdAt: now,
        updatedAt: now,
      };

      const updateInput: UpdateServiceInput = {
        name: "Updated Service",
        value: 150,
      };

      const updatedService: IOrderService = {
        ...existingOrder.services[0],
        ...updateInput,
        updatedAt: new Date(),
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(mockOrderRepository.updateService).mockResolvedValue(
        updatedService
      );

      const result = await orderService.updateService(
        orderId,
        serviceId,
        mockUser,
        updateInput
      );

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderRepository.updateService).toHaveBeenCalledWith(
        orderId,
        serviceId,
        expect.objectContaining({
          ...existingOrder.services[0],
          ...updateInput,
        })
      );
      expect(result.name).toEqual(updateInput.name);
      expect(result.value).toEqual(updateInput.value);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const notFoundError = new NotFoundError("Order not found", {
        origin: "OrderRepository.findById",
      });

      const updateInput: UpdateServiceInput = {
        name: "Updated Service",
      };

      vi.mocked(mockOrderRepository.findById).mockRejectedValue(notFoundError);

      await expect(
        orderService.updateService(orderId, serviceId, mockUser, updateInput)
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.updateService).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not have access", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const otherUserId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: otherUserId,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateServiceInput = {
        name: "Updated Service",
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateService(orderId, serviceId, mockUser, updateInput)
      ).rejects.toThrow(NotFoundError);

      expect(mockOrderRepository.updateService).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when service is not found", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const nonExistentServiceId = new Types.ObjectId();
      const existingOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: mockUser.id,
        services: [
          {
            id: serviceId,
            name: "Service 1",
            value: 100,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateInput: UpdateServiceInput = {
        name: "Updated Service",
      };

      vi.mocked(mockOrderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateService(
          orderId,
          nonExistentServiceId,
          mockUser,
          updateInput
        )
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderService.updateService(
          orderId,
          nonExistentServiceId,
          mockUser,
          updateInput
        )
      ).rejects.toThrow("Service not found");

      expect(mockOrderRepository.updateService).not.toHaveBeenCalled();
    });
  });
});
