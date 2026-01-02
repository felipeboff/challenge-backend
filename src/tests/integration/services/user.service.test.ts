import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BadRequestError, NotFoundError } from "../../../shared/app-error";
import { PasswordHash } from "../../../shared/password-hash";
import { UserModel } from "../../../database/models/user.model";
import { UserService } from "../../../modules/users/user.service";
import { UserRepository } from "../../../modules/users/user.repository";
import { createMockUserInput } from "../../mocks/user.mock";

describe("UserService - Integration Tests", () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let passwordHash: PasswordHash;

  beforeEach(async () => {
    // Initialize real instances (no mocks)
    passwordHash = new PasswordHash();
    userRepository = new UserRepository(UserModel);
    userService = new UserService(userRepository, passwordHash);
  });

  describe("createUser", () => {
    it("should create a user successfully and return safe user without password", async () => {
      const userInput = createMockUserInput();

      const result = await userService.createUser(userInput);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email", userInput.email);
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("password");

      // Verify user was saved in database
      const userInDb = await UserModel.findOne({
        email: userInput.email,
      }).lean();
      expect(userInDb).toBeTruthy();
      expect(userInDb?.email).toBe(userInput.email);
      expect(userInDb?.password).toBeTruthy();
      expect(userInDb?.password).not.toBe(userInput.password); // Password should be hashed

      // Verify password was hashed correctly
      const isPasswordValid = await passwordHash.compare(
        userInput.password,
        userInDb!.password
      );
      expect(isPasswordValid).toBe(true);

      // Verify returned user matches database user (except password)
      expect(result.id.toString()).toBe(userInDb!._id.toString());
      expect(result.email).toBe(userInDb!.email);
    });

    it("should throw BadRequestError when email already exists", async () => {
      const userInput = createMockUserInput();

      // Create first user
      await userService.createUser(userInput);

      // Try to create user with same email
      await expect(userService.createUser(userInput)).rejects.toThrow(
        BadRequestError
      );
      await expect(userService.createUser(userInput)).rejects.toThrow(
        "Email already exists"
      );

      // Verify only one user exists in database
      const usersCount = await UserModel.countDocuments({
        email: userInput.email,
      });
      expect(usersCount).toBe(1);
    });

    it("should hash password correctly", async () => {
      const userInput = createMockUserInput();
      const plainPassword = userInput.password;

      await userService.createUser(userInput);

      const userInDb = await UserModel.findOne({
        email: userInput.email,
      }).lean();
      expect(userInDb).toBeTruthy();
      expect(userInDb?.password).not.toBe(plainPassword);
      expect(userInDb?.password.length).toBeGreaterThan(plainPassword.length);

      // Verify password can be verified
      const isValid = await passwordHash.compare(
        plainPassword,
        userInDb!.password
      );
      expect(isValid).toBe(true);
    });

    it("should not expose password in returned user object", async () => {
      const userInput = createMockUserInput();

      const result = await userService.createUser(userInput);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).not.toContain("password");
      expect(Object.keys(result)).toEqual([
        "id",
        "email",
        "createdAt",
        "updatedAt",
      ]);
    });

    it("should create multiple users with different emails", async () => {
      const userInput1 = createMockUserInput();
      const userInput2 = createMockUserInput();

      const result1 = await userService.createUser(userInput1);
      const result2 = await userService.createUser(userInput2);

      expect(result1.id).not.toEqual(result2.id);
      expect(result1.email).not.toBe(result2.email);

      // Verify both users exist in database
      const usersCount = await UserModel.countDocuments({
        email: { $in: [userInput1.email, userInput2.email] },
      });
      expect(usersCount).toBe(2);
    });

    it("should set createdAt and updatedAt timestamps", async () => {
      const userInput = createMockUserInput();
      const beforeCreation = new Date();

      const result = await userService.createUser(userInput);

      const afterCreation = new Date();

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
    });
  });

  describe("getUserByEmail", () => {
    it("should return safe user when user is found", async () => {
      const userInput = createMockUserInput();

      // Create user first
      const createdUser = await userService.createUser(userInput);

      // Get user by email
      const result = await userService.getUserByEmail(userInput.email);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email", userInput.email);
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("password");

      // Verify returned user matches created user
      expect(result.id).toEqual(createdUser.id);
      expect(result.email).toBe(createdUser.email);
      expect(result.createdAt).toEqual(createdUser.createdAt);
      expect(result.updatedAt).toEqual(createdUser.updatedAt);
    });

    it("should throw NotFoundError when user is not found", async () => {
      const email = "nonexistent@example.com";

      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        NotFoundError
      );
      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        "User not found"
      );
    });

    it("should not expose password in returned user object", async () => {
      const userInput = createMockUserInput();

      await userService.createUser(userInput);

      const result = await userService.getUserByEmail(userInput.email);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).not.toContain("password");
      expect(Object.keys(result)).toEqual([
        "id",
        "email",
        "createdAt",
        "updatedAt",
      ]);
    });

    it("should work with case-sensitive email", async () => {
      const userInput = createMockUserInput({ email: "Test@Example.com" });

      await userService.createUser(userInput);

      // Get with exact case should work
      const result = await userService.getUserByEmail("Test@Example.com");
      expect(result.email).toBe("Test@Example.com");

      // Get with different case should fail (MongoDB default is case-sensitive)
      await expect(
        userService.getUserByEmail("test@example.com")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getUserById", () => {
    it("should return safe user when user is found", async () => {
      const userInput = createMockUserInput();

      // Create user first
      const createdUser = await userService.createUser(userInput);

      // Get user by id
      const result = await userService.getUserById(createdUser.id);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email", userInput.email);
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("password");

      // Verify returned user matches created user
      expect(result.id).toEqual(createdUser.id);
      expect(result.email).toBe(createdUser.email);
      expect(result.createdAt).toEqual(createdUser.createdAt);
      expect(result.updatedAt).toEqual(createdUser.updatedAt);
    });

    it("should throw NotFoundError when user is not found", async () => {
      const fakeUserId = new Types.ObjectId();

      await expect(userService.getUserById(fakeUserId)).rejects.toThrow(
        NotFoundError
      );
      await expect(userService.getUserById(fakeUserId)).rejects.toThrow(
        "User not found"
      );
    });

    it("should not expose password in returned user object", async () => {
      const userInput = createMockUserInput();

      const createdUser = await userService.createUser(userInput);

      const result = await userService.getUserById(createdUser.id);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).not.toContain("password");
      expect(Object.keys(result)).toEqual([
        "id",
        "email",
        "createdAt",
        "updatedAt",
      ]);
    });

    it("should return correct user when multiple users exist", async () => {
      const userInput1 = createMockUserInput();
      const userInput2 = createMockUserInput();

      const createdUser1 = await userService.createUser(userInput1);
      const createdUser2 = await userService.createUser(userInput2);

      const result1 = await userService.getUserById(createdUser1.id);
      const result2 = await userService.getUserById(createdUser2.id);

      expect(result1.id).toEqual(createdUser1.id);
      expect(result1.email).toBe(userInput1.email);
      expect(result2.id).toEqual(createdUser2.id);
      expect(result2.email).toBe(userInput2.email);
      expect(result1.id).not.toEqual(result2.id);
    });
  });

  describe("Integration between methods", () => {
    it("should allow creating user and then retrieving by email", async () => {
      const userInput = createMockUserInput();

      const createdUser = await userService.createUser(userInput);
      const retrievedUser = await userService.getUserByEmail(userInput.email);

      expect(retrievedUser.id).toEqual(createdUser.id);
      expect(retrievedUser.email).toBe(createdUser.email);
    });

    it("should allow creating user and then retrieving by id", async () => {
      const userInput = createMockUserInput();

      const createdUser = await userService.createUser(userInput);
      const retrievedUser = await userService.getUserById(createdUser.id);

      expect(retrievedUser.id).toEqual(createdUser.id);
      expect(retrievedUser.email).toBe(createdUser.email);
    });

    it("should maintain data consistency across different retrieval methods", async () => {
      const userInput = createMockUserInput();

      const createdUser = await userService.createUser(userInput);
      const userByEmail = await userService.getUserByEmail(userInput.email);
      const userById = await userService.getUserById(createdUser.id);

      // All three should return the same user data
      expect(userByEmail.id).toEqual(createdUser.id);
      expect(userById.id).toEqual(createdUser.id);
      expect(userByEmail.email).toBe(userById.email);
      expect(userByEmail.createdAt).toEqual(userById.createdAt);
      expect(userByEmail.updatedAt).toEqual(userById.updatedAt);
    });
  });
});
