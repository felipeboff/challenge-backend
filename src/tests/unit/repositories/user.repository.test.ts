import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../../shared/app-error";
import { UserModel } from "../../../database/models/user.model";
import { UserRepository } from "../../../modules/users/user.repository";
import type { IUser } from "../../../modules/users/user.type";
import { createMockUserInput } from "../../mocks/user.mock";

describe("UserRepository - Unit Tests", () => {
  let userRepository: UserRepository;
  let mockUserModel: typeof UserModel;

  beforeEach(() => {
    // Create mock for UserModel
    mockUserModel = {
      create: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
    } as unknown as typeof UserModel;

    userRepository = new UserRepository(mockUserModel);
  });

  describe("create", () => {
    it("should create a user successfully", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const now = new Date();

      const mockUser: IUser = {
        id: userId,
        email: userInput.email,
        password: userInput.password,
        createdAt: now,
        updatedAt: now,
      };

      const mockDocument = {
        toObject: vi.fn().mockReturnValue({
          _id: userId,
          email: userInput.email,
          password: userInput.password,
          createdAt: now,
          updatedAt: now,
        }),
      };

      vi.mocked(mockUserModel.create).mockResolvedValue(mockDocument as any);

      const result = await userRepository.create(mockUser);

      expect(mockUserModel.create).toHaveBeenCalledWith({
        _id: userId,
        email: userInput.email,
        password: userInput.password,
        createdAt: now,
        updatedAt: now,
      });
      expect(result.id).toEqual(userId);
      expect(result.email).toEqual(userInput.email);
      expect(result.password).toEqual(userInput.password);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });

    it("should handle errors during user creation", async () => {
      const userInput = createMockUserInput();
      const userId = new Types.ObjectId();
      const now = new Date();

      const mockUser: IUser = {
        id: userId,
        email: userInput.email,
        password: userInput.password,
        createdAt: now,
        updatedAt: now,
      };

      const error = new Error("Database error");
      vi.mocked(mockUserModel.create).mockRejectedValue(error);

      await expect(userRepository.create(mockUser)).rejects.toThrow(
        "Database error"
      );
      expect(mockUserModel.create).toHaveBeenCalled();
    });
  });

  describe("findByEmail", () => {
    it("should return a user when found by email", async () => {
      const email = "test@example.com";
      const userId = new Types.ObjectId();
      const hashedPassword = "hashed-password";
      const now = new Date();

      const mockDocument = {
        _id: userId,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockUserModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await userRepository.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).not.toBeNull();
      expect(result!.id).toEqual(userId);
      expect(result!.email).toEqual(email);
      expect(result!.password).toEqual(hashedPassword);
      expect(result!.createdAt).toEqual(now);
      expect(result!.updatedAt).toEqual(now);
    });

    it("should return null when user is not found by email", async () => {
      const email = "nonexistent@example.com";

      vi.mocked(mockUserModel.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const result = await userRepository.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });

    it("should handle errors during findByEmail", async () => {
      const email = "test@example.com";
      const error = new Error("Database error");

      vi.mocked(mockUserModel.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue(error),
      } as any);

      await expect(userRepository.findByEmail(email)).rejects.toThrow(
        "Database error"
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe("findById", () => {
    it("should return a user when found by id", async () => {
      const userId = new Types.ObjectId();
      const email = "test@example.com";
      const hashedPassword = "hashed-password";
      const now = new Date();

      const mockDocument = {
        _id: userId,
        email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(mockUserModel.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await userRepository.findById(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result.id).toEqual(userId);
      expect(result.email).toEqual(email);
      expect(result.password).toEqual(hashedPassword);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });

    it("should throw NotFoundError when user is not found by id", async () => {
      const userId = new Types.ObjectId();

      vi.mocked(mockUserModel.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(userRepository.findById(userId)).rejects.toThrow(
        NotFoundError
      );
      await expect(userRepository.findById(userId)).rejects.toThrow(
        "User not found"
      );

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it("should handle errors during findById", async () => {
      const userId = new Types.ObjectId();
      const error = new Error("Database error");

      vi.mocked(mockUserModel.findById).mockReturnValue({
        lean: vi.fn().mockRejectedValue(error),
      } as any);

      await expect(userRepository.findById(userId)).rejects.toThrow(
        "Database error"
      );
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });
  });
});
