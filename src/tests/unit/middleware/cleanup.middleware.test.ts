import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import cleanupMiddleware from "../../../middleware/cleanup.middleware";
import type { IUser } from "../../../modules/users/user.type";
import { Types } from "mongoose";

describe("CleanupMiddleware - Unit Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};

    mockResponse = {};

    mockNext = vi.fn();
  });

  describe("handle", () => {
    it("should call next when authContext is not present", () => {
      cleanupMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.authContext).toBeUndefined();
    });

    it("should delete authContext when it exists", () => {
      const mockUser: IUser = {
        id: new Types.ObjectId(),
        email: "test@example.com",
        password: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.authContext = { user: mockUser };

      cleanupMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.authContext).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should call next after cleanup", () => {
      const mockUser: IUser = {
        id: new Types.ObjectId(),
        email: "test@example.com",
        password: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.authContext = { user: mockUser };

      cleanupMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple calls correctly", () => {
      const mockUser: IUser = {
        id: new Types.ObjectId(),
        email: "test@example.com",
        password: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.authContext = { user: mockUser };

      cleanupMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.authContext).toBeUndefined();

      // Call again without authContext
      cleanupMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockRequest.authContext).toBeUndefined();
    });
  });
});
