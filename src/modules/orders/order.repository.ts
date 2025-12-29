import { type Document, type Model, QueryFilter, Types } from "mongoose";

import { NotFoundError } from "../../shared/app-error";
import type { GetOrdersQueryInput } from "./order.schema";
import type { IOrderPagination, IOrderService } from "./order.type";
import { ENUMOrderStatus } from "./order.type";
import type { IOrder } from "./order.type";

export interface IOrderDocument extends Omit<IOrder, "id" | "services"> {
  _id: Types.ObjectId;
  services: IOrderServiceDocument[];
}

export interface IOrderServiceDocument extends Omit<IOrderService, "id"> {
  _id: Types.ObjectId;
}

export const toDocumentOrder = (order: IOrder): IOrderDocument => {
  return {
    _id: order.id,
    labName: order.labName,
    patientName: order.patientName,
    clinicName: order.clinicName,
    stage: order.stage,
    status: order.status,
    userId: order.userId,
    services: order.services.map(toDocumentService),
    expiresAt: order.expiresAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

export const toObjectOrder = (order: unknown): IOrder => {
  const _order = order as IOrderDocument;
  return {
    id: _order._id,
    labName: _order.labName,
    patientName: _order.patientName,
    clinicName: _order.clinicName,
    stage: _order.stage,
    status: _order.status,
    userId: _order.userId,
    services: _order.services.map(toObjectService),
    expiresAt: _order.expiresAt,
    createdAt: _order.createdAt,
    updatedAt: _order.updatedAt,
  };
};

export const toDocumentService = (
  service: IOrderService
): IOrderServiceDocument => {
  return {
    _id: service.id,
    name: service.name,
    value: service.value,
    status: service.status,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};

export const toObjectService = (service: unknown): IOrderService => {
  const _service = service as IOrderServiceDocument;
  return {
    id: _service._id,
    name: _service.name,
    value: _service.value,
    status: _service.status,
    createdAt: _service.createdAt,
    updatedAt: _service.updatedAt,
  };
};

export class OrderRepository {
  constructor(private readonly orderModel: Model<IOrder>) {}

  public create = async (order: IOrder): Promise<IOrder> => {
    const documentOrder = toDocumentOrder(order);
    const result = await this.orderModel.create(documentOrder);
    return toObjectOrder(result.toObject());
  };

  public findById = async (orderId: Types.ObjectId): Promise<IOrder> => {
    const result = await this.orderModel.findById(orderId).lean();
    if (!result) {
      throw new NotFoundError("Order not found", {
        origin: "OrderRepository.findById",
      });
    }

    return toObjectOrder(result);
  };

  public createService = async (
    orderId: Types.ObjectId,
    service: IOrderService
  ): Promise<IOrderService> => {
    const documentService = toDocumentService(service);
    const result = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { $push: { services: documentService } },
        { new: true }
      )
      .lean();

    if (!result) {
      throw new NotFoundError("Order not found", {
        origin: "OrderRepository.createService",
      });
    }

    const objectResult = toObjectOrder(result);

    const createdService = objectResult.services.find((item) =>
      item.id.equals(service.id)
    );
    if (!createdService) {
      throw new NotFoundError("Service not found", {
        origin: "OrderRepository.createService",
      });
    }

    return createdService;
  };

  public update = async (
    orderId: Types.ObjectId,
    data: IOrder
  ): Promise<IOrder> => {
    const documentOrder = toDocumentOrder(data);

    const result = await this.orderModel
      .findByIdAndUpdate(orderId, documentOrder, { new: true })
      .lean();

    if (!result) {
      throw new NotFoundError("Order not found", {
        origin: "OrderRepository.update",
      });
    }

    return toObjectOrder(result);
  };

  public findAllPaginated = async (
    userId: Types.ObjectId,
    query: GetOrdersQueryInput
  ): Promise<IOrderPagination> => {
    const filter: QueryFilter<IOrder> = {
      userId,
      status: ENUMOrderStatus.ACTIVE,
      ...(query.stage && { stage: query.stage }),
    };

    const result = await this.orderModel
      .find(filter)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean();

    const total = await this.orderModel.countDocuments(filter);

    const pagination: IOrderPagination = {
      orders: result.map(toObjectOrder),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page < Math.ceil(total / query.limit),
      hasPreviousPage: query.page > 1,
    };

    return pagination;
  };

  public updateService = async (
    orderId: Types.ObjectId,
    serviceId: Types.ObjectId,
    data: IOrderService
  ): Promise<IOrderService> => {
    const documentService = toDocumentService(data);
    const result = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, "services._id": serviceId },
        { $set: { "services.$[elem]": documentService } },
        {
          arrayFilters: [{ "elem._id": serviceId }],
          new: true,
        }
      )
      .lean();

    if (!result) {
      throw new NotFoundError("Order or Service not found", {
        origin: "OrderRepository.updateService",
      });
    }

    const objectResult = toObjectOrder(result);

    const updatedService = objectResult.services.find((item) =>
      item.id.equals(serviceId)
    );
    if (!updatedService) {
      throw new NotFoundError("Service not found", {
        origin: "OrderRepository.updateService",
      });
    }

    return updatedService;
  };
}
