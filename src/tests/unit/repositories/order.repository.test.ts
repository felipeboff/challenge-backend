import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../../shared/app-error";
import { OrderModel } from "../../../database/models/order.model";
import { OrderRepository } from "../../../modules/orders/order.repository";
import type { GetOrdersQueryInput } from "../../../modules/orders/order.schema";
import {
  ENUMOrderServiceStatus,
  ENUMOrderStage,
  ENUMOrderStatus,
  IOrder,
  IOrderPagination,
  IOrderService,
} from "../../../modules/orders/order.type";
import {
  createMockOrderInput,
  createMockServiceInput,
} from "../../mocks/order.mock";

describe("OrderRepository - Unit Tests", () => {
  let orderRepository: OrderRepository;
  let mockOrderModel: any;

  beforeEach(() => {
    // Create mock for OrderModel
    mockOrderModel = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOneAndUpdate: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
    };

    orderRepository = new OrderRepository(mockOrderModel);
  });

  describe("create", () => {
    it("should create an order successfully", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000); // 1 day from now

      const mockOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId,
        services: [
          {
            id: serviceId,
            name: "Test Service",
            value: 100.0,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        toObject: vi.fn().mockReturnValue({
          _id: orderId,
          labName: mockOrder.labName,
          patientName: mockOrder.patientName,
          clinicName: mockOrder.clinicName,
          stage: mockOrder.stage,
          status: mockOrder.status,
          userId: mockOrder.userId,
          services: [
            {
              _id: serviceId,
              name: mockOrder.services[0].name,
              value: mockOrder.services[0].value,
              status: mockOrder.services[0].status,
              createdAt: now,
              updatedAt: now,
            },
          ],
          expiresAt: mockOrder.expiresAt,
          createdAt: now,
          updatedAt: now,
        }),
      };

      vi.mocked(mockOrderModel.create).mockResolvedValue(mockDocument);

      const result = await orderRepository.create(mockOrder);

      expect(mockOrderModel.create).toHaveBeenCalled();
      expect(result.id).toEqual(orderId);
      expect(result.labName).toEqual(mockOrder.labName);
      expect(result.patientName).toEqual(mockOrder.patientName);
      expect(result.clinicName).toEqual(mockOrder.clinicName);
      expect(result.stage).toEqual(mockOrder.stage);
      expect(result.status).toEqual(mockOrder.status);
      expect(result.userId).toEqual(userId);
      expect(result.services).toHaveLength(1);
      expect(result.services[0].id).toEqual(serviceId);
      expect(result.services[0].name).toEqual("Test Service");
    });

    it("should handle errors during order creation", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const now = new Date();

      const mockOrder: IOrder = {
        id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId,
        services: [],
        expiresAt: new Date(),
        createdAt: now,
        updatedAt: now,
      };

      const error = new Error("Database error");
      vi.mocked(mockOrderModel.create).mockRejectedValue(error);

      await expect(orderRepository.create(mockOrder)).rejects.toThrow(
        "Database error"
      );
      expect(mockOrderModel.create).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return an order when found by id", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const mockDocument = {
        _id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId,
        services: [
          {
            _id: serviceId,
            name: "Test Service",
            value: 100.0,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await orderRepository.findById(orderId);

      expect(mockOrderModel.findById).toHaveBeenCalledWith(orderId);
      expect(result.id).toEqual(orderId);
      expect(result.labName).toEqual("Test Lab");
      expect(result.patientName).toEqual("Test Patient");
      expect(result.clinicName).toEqual("Test Clinic");
      expect(result.services).toHaveLength(1);
      expect(result.services[0].id).toEqual(serviceId);
    });

    it("should throw NotFoundError when order is not found by id", async () => {
      const orderId = new Types.ObjectId();

      vi.mocked(mockOrderModel.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(orderRepository.findById(orderId)).rejects.toThrow(
        NotFoundError
      );
      await expect(orderRepository.findById(orderId)).rejects.toThrow(
        "Order not found"
      );

      expect(mockOrderModel.findById).toHaveBeenCalledWith(orderId);
    });

    it("should handle errors during findById", async () => {
      const orderId = new Types.ObjectId();
      const error = new Error("Database error");

      vi.mocked(mockOrderModel.findById).mockReturnValue({
        lean: vi.fn().mockRejectedValue(error),
      } as any);

      await expect(orderRepository.findById(orderId)).rejects.toThrow(
        "Database error"
      );
      expect(mockOrderModel.findById).toHaveBeenCalledWith(orderId);
    });
  });

  describe("createService", () => {
    it("should create a service successfully", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const newService: IOrderService = {
        id: serviceId,
        name: "New Service",
        value: 200.0,
        status: ENUMOrderServiceStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        _id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId,
        services: [
          {
            _id: serviceId,
            name: newService.name,
            value: newService.value,
            status: newService.status,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findByIdAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await orderRepository.createService(orderId, newService);

      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        orderId,
        { $push: { services: expect.objectContaining({ _id: serviceId }) } },
        { new: true }
      );
      expect(result.id).toEqual(serviceId);
      expect(result.name).toEqual(newService.name);
      expect(result.value).toEqual(newService.value);
      expect(result.status).toEqual(newService.status);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();

      const newService: IOrderService = {
        id: serviceId,
        name: "New Service",
        value: 200.0,
        status: ENUMOrderServiceStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findByIdAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(
        orderRepository.createService(orderId, newService)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderRepository.createService(orderId, newService)
      ).rejects.toThrow("Order not found");

      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should throw NotFoundError when service is not found after creation", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const differentServiceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const newService: IOrderService = {
        id: serviceId,
        name: "New Service",
        value: 200.0,
        status: ENUMOrderServiceStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        _id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: new Types.ObjectId(),
        services: [
          {
            _id: differentServiceId, // Different ID
            name: "Other Service",
            value: 100.0,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findByIdAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      await expect(
        orderRepository.createService(orderId, newService)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderRepository.createService(orderId, newService)
      ).rejects.toThrow("Service not found");
    });
  });

  describe("update", () => {
    it("should update an order successfully", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const updatedOrder: IOrder = {
        id: orderId,
        labName: "Updated Lab",
        patientName: "Updated Patient",
        clinicName: "Updated Clinic",
        stage: ENUMOrderStage.ANALYSIS,
        status: ENUMOrderStatus.ACTIVE,
        userId,
        services: [
          {
            id: serviceId,
            name: "Updated Service",
            value: 150.0,
            status: ENUMOrderServiceStatus.DONE,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        _id: orderId,
        labName: updatedOrder.labName,
        patientName: updatedOrder.patientName,
        clinicName: updatedOrder.clinicName,
        stage: updatedOrder.stage,
        status: updatedOrder.status,
        userId: updatedOrder.userId,
        services: [
          {
            _id: serviceId,
            name: updatedOrder.services[0].name,
            value: updatedOrder.services[0].value,
            status: updatedOrder.services[0].status,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt: updatedOrder.expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findByIdAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await orderRepository.update(orderId, updatedOrder);

      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining({
          labName: updatedOrder.labName,
          patientName: updatedOrder.patientName,
        }),
        { new: true }
      );
      expect(result.id).toEqual(orderId);
      expect(result.labName).toEqual(updatedOrder.labName);
      expect(result.patientName).toEqual(updatedOrder.patientName);
      expect(result.stage).toEqual(ENUMOrderStage.ANALYSIS);
    });

    it("should throw NotFoundError when order is not found", async () => {
      const orderId = new Types.ObjectId();
      const now = new Date();

      const updatedOrder: IOrder = {
        id: orderId,
        labName: "Updated Lab",
        patientName: "Updated Patient",
        clinicName: "Updated Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: new Types.ObjectId(),
        services: [],
        expiresAt: new Date(),
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findByIdAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(
        orderRepository.update(orderId, updatedOrder)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderRepository.update(orderId, updatedOrder)
      ).rejects.toThrow("Order not found");

      expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe("findAllPaginated", () => {
    it("should return paginated orders successfully", async () => {
      const userId = new Types.ObjectId();
      const orderId1 = new Types.ObjectId();
      const orderId2 = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const query: GetOrdersQueryInput = {
        page: 1,
        limit: 10,
      };

      const mockDocuments = [
        {
          _id: orderId1,
          labName: "Lab 1",
          patientName: "Patient 1",
          clinicName: "Clinic 1",
          stage: ENUMOrderStage.CREATED,
          status: ENUMOrderStatus.ACTIVE,
          userId,
          services: [
            {
              _id: serviceId,
              name: "Service 1",
              value: 100.0,
              status: ENUMOrderServiceStatus.PENDING,
              createdAt: now,
              updatedAt: now,
            },
          ],
          expiresAt,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: orderId2,
          labName: "Lab 2",
          patientName: "Patient 2",
          clinicName: "Clinic 2",
          stage: ENUMOrderStage.CREATED,
          status: ENUMOrderStatus.ACTIVE,
          userId,
          services: [
            {
              _id: serviceId,
              name: "Service 2",
              value: 200.0,
              status: ENUMOrderServiceStatus.PENDING,
              createdAt: now,
              updatedAt: now,
            },
          ],
          expiresAt,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const mockQuery = {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockDocuments),
      };

      vi.mocked(mockOrderModel.find).mockReturnValue(mockQuery as any);
      vi.mocked(mockOrderModel.countDocuments).mockResolvedValue(2);

      const result = await orderRepository.findAllPaginated(userId, query);

      expect(mockOrderModel.find).toHaveBeenCalledWith({
        userId,
        status: ENUMOrderStatus.ACTIVE,
      });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockOrderModel.countDocuments).toHaveBeenCalledWith({
        userId,
        status: ENUMOrderStatus.ACTIVE,
      });
      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it("should filter by stage when provided", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const query: GetOrdersQueryInput = {
        page: 1,
        limit: 10,
        stage: ENUMOrderStage.ANALYSIS,
      };

      const mockDocuments = [
        {
          _id: orderId,
          labName: "Lab 1",
          patientName: "Patient 1",
          clinicName: "Clinic 1",
          stage: ENUMOrderStage.ANALYSIS,
          status: ENUMOrderStatus.ACTIVE,
          userId,
          services: [
            {
              _id: serviceId,
              name: "Service 1",
              value: 100.0,
              status: ENUMOrderServiceStatus.PENDING,
              createdAt: now,
              updatedAt: now,
            },
          ],
          expiresAt,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const mockQuery = {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockDocuments),
      };

      vi.mocked(mockOrderModel.find).mockReturnValue(mockQuery as any);
      vi.mocked(mockOrderModel.countDocuments).mockResolvedValue(1);

      const result = await orderRepository.findAllPaginated(userId, query);

      expect(mockOrderModel.find).toHaveBeenCalledWith({
        userId,
        status: ENUMOrderStatus.ACTIVE,
        stage: ENUMOrderStage.ANALYSIS,
      });
      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should calculate pagination correctly for multiple pages", async () => {
      const userId = new Types.ObjectId();
      const query: GetOrdersQueryInput = {
        page: 2,
        limit: 10,
      };

      const mockDocuments: any[] = [];

      const mockQuery = {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockDocuments),
      };

      vi.mocked(mockOrderModel.find).mockReturnValue(mockQuery as any);
      vi.mocked(mockOrderModel.countDocuments).mockResolvedValue(25);

      const result = await orderRepository.findAllPaginated(userId, query);

      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it("should return empty array when no orders found", async () => {
      const userId = new Types.ObjectId();
      const query: GetOrdersQueryInput = {
        page: 1,
        limit: 10,
      };

      const mockQuery = {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockOrderModel.find).mockReturnValue(mockQuery as any);
      vi.mocked(mockOrderModel.countDocuments).mockResolvedValue(0);

      const result = await orderRepository.findAllPaginated(userId, query);

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
  });

  describe("updateService", () => {
    it("should update a service successfully", async () => {
      const userId = new Types.ObjectId();
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const updatedService: IOrderService = {
        id: serviceId,
        name: "Updated Service",
        value: 250.0,
        status: ENUMOrderServiceStatus.DONE,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        _id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId,
        services: [
          {
            _id: serviceId,
            name: updatedService.name,
            value: updatedService.value,
            status: updatedService.status,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await orderRepository.updateService(
        orderId,
        serviceId,
        updatedService
      );

      expect(mockOrderModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: orderId, "services._id": serviceId },
        { $set: { "services.$[elem]": expect.objectContaining({ _id: serviceId }) } },
        {
          arrayFilters: [{ "elem._id": serviceId }],
          new: true,
        }
      );
      expect(result.id).toEqual(serviceId);
      expect(result.name).toEqual(updatedService.name);
      expect(result.value).toEqual(updatedService.value);
      expect(result.status).toEqual(updatedService.status);
    });

    it("should throw NotFoundError when order or service is not found", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const now = new Date();

      const updatedService: IOrderService = {
        id: serviceId,
        name: "Updated Service",
        value: 250.0,
        status: ENUMOrderServiceStatus.DONE,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(
        orderRepository.updateService(orderId, serviceId, updatedService)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderRepository.updateService(orderId, serviceId, updatedService)
      ).rejects.toThrow("Order or Service not found");

      expect(mockOrderModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should throw NotFoundError when service is not found after update", async () => {
      const orderId = new Types.ObjectId();
      const serviceId = new Types.ObjectId();
      const differentServiceId = new Types.ObjectId();
      const now = new Date();
      const expiresAt = new Date(Date.now() + 86400000);

      const updatedService: IOrderService = {
        id: serviceId,
        name: "Updated Service",
        value: 250.0,
        status: ENUMOrderServiceStatus.DONE,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        _id: orderId,
        labName: "Test Lab",
        patientName: "Test Patient",
        clinicName: "Test Clinic",
        stage: ENUMOrderStage.CREATED,
        status: ENUMOrderStatus.ACTIVE,
        userId: new Types.ObjectId(),
        services: [
          {
            _id: differentServiceId, // Different ID
            name: "Other Service",
            value: 100.0,
            status: ENUMOrderServiceStatus.PENDING,
            createdAt: now,
            updatedAt: now,
          },
        ],
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockOrderModel.findOneAndUpdate).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      await expect(
        orderRepository.updateService(orderId, serviceId, updatedService)
      ).rejects.toThrow(NotFoundError);
      await expect(
        orderRepository.updateService(orderId, serviceId, updatedService)
      ).rejects.toThrow("Service not found");
    });
  });
});

