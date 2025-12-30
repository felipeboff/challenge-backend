import type { NextFunction, Request, Response } from "express";
import { MongooseError } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import z from "zod";

import {
  AppError,
  BadRequestError,
  StatusCodeError,
} from "../../../shared/app-error";
import logger from "../../../shared/logger";
import errorHandlerMiddleware from "../../../middleware/error-handler.middleware";

// Mock logger
vi.mock("../../../shared/logger", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ErrorHandlerMiddleware - Unit Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      path: "/test",
      method: "GET",
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe("handle", () => {
    it("should handle AppError correctly", () => {
      const error = new BadRequestError("Bad request error", {
        field: "email",
      });

      const result = errorHandlerMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.warn).toHaveBeenCalledWith("Application error", {
        details: {
          statusCode: StatusCodeError.BAD_REQUEST,
          message: "Bad request error",
          path: "/test",
          method: "GET",
          details: { field: "email" },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodeError.BAD_REQUEST
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Bad request error",
      });
      expect(result).toBe(mockResponse);
    });

    it("should handle ZodError correctly", () => {
      const zodError = z
        .object({
          email: z.string().email(),
          age: z.number().min(18),
        })
        .safeParse({ email: "invalid", age: 15 }).error;

      if (zodError) {
        const result = errorHandlerMiddleware(
          zodError,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(logger.warn).toHaveBeenCalledWith("Validation error", {
          error: zodError,
          details: {
            statusCode: StatusCodeError.BAD_REQUEST,
            path: "/test",
            method: "GET",
            issues: zodError.issues,
          },
        });
        expect(mockResponse.status).toHaveBeenCalledWith(
          StatusCodeError.BAD_REQUEST
        );
        expect(mockResponse.json).toHaveBeenCalledWith({
          issues: zodError.issues,
        });
        expect(result).toBe(mockResponse);
      }
    });

    it("should handle MongooseError (MongoServerError) correctly", () => {
      const mongooseError = new Error("MongoServerError") as MongooseError;
      mongooseError.name = "MongoServerError";

      const result = errorHandlerMiddleware(
        mongooseError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith("Mongoose error", {
        error: mongooseError,
        details: {
          stack: mongooseError.stack,
          path: "/test",
          method: "GET",
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodeError.SERVICE_UNAVAILABLE
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Service unavailable",
      });
      expect(result).toBe(mockResponse);
    });

    it("should handle generic Error correctly", () => {
      const error = new Error("Generic error message");

      const result = errorHandlerMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith("Error not handled", {
        error,
        details: {
          path: "/test",
          method: "GET",
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodeError.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Generic error message",
      });
      expect(result).toBe(mockResponse);
    });

    it("should handle unknown error type correctly", () => {
      const unknownError = { code: "ERR001", message: "Unknown error" };

      const result = errorHandlerMiddleware(
        unknownError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith("Unknown error", {
        error: unknownError,
        details: {
          path: "/test",
          method: "GET",
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodeError.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Unknown error",
      });
      expect(result).toBe(mockResponse);
    });

    it("should handle null error", () => {
      const result = errorHandlerMiddleware(
        null as unknown as Error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith("Unknown error", {
        error: null,
        details: {
          path: "/test",
          method: "GET",
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodeError.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Unknown error",
      });
    });

    it("should handle AppError without details", () => {
      const error = new AppError("Simple error", StatusCodeError.NOT_FOUND);

      const result = errorHandlerMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.warn).toHaveBeenCalledWith("Application error", {
        details: {
          statusCode: StatusCodeError.NOT_FOUND,
          message: "Simple error",
          path: "/test",
          method: "GET",
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodeError.NOT_FOUND
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Simple error",
      });
    });
  });
});
