import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { UnauthorizedError } from "../../../shared/app-error";
import { JwtService } from "../../../shared/jwt-service";
import { PasswordHash } from "../../../shared/password-hash";
import { UserModel } from "../../../database/models/user.model";
import { AuthService } from "../../../modules/auth/auth.service";
import { UserRepository } from "../../../modules/users/user.repository";
import { UserService } from "../../../modules/users/user.service";
import { createMockUserInput } from "../../mocks/user.mock";

describe("AuthService - Integration Tests", () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let userService: UserService;
  let jwtService: JwtService;
  let passwordHash: PasswordHash;

  beforeEach(async () => {
    // Initialize real instances (no mocks)
    passwordHash = new PasswordHash();
    jwtService = new JwtService();
    userRepository = new UserRepository(UserModel);
    userService = new UserService(userRepository, passwordHash);
    authService = new AuthService(
      userRepository,
      userService,
      jwtService,
      passwordHash
    );
  });

  describe("registerUser", () => {
    it("should register a user successfully and return token", async () => {
      const userInput = createMockUserInput();

      const result = await authService.registerUser(userInput);

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("id");
      expect(result.user).toHaveProperty("email", userInput.email);
      expect(result.user).toHaveProperty("createdAt");
      expect(result.user).toHaveProperty("updatedAt");
      expect(result.user).not.toHaveProperty("password");

      // Verify token is valid JWT
      expect(result.token).toBeTruthy();
      expect(typeof result.token).toBe("string");
      expect(result.token.split(".")).toHaveLength(3); // JWT has 3 parts

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
    });

    it("should throw error when email already exists", async () => {
      const userInput = createMockUserInput();

      // Register first user
      await authService.registerUser(userInput);

      // Try to register with same email
      await expect(authService.registerUser(userInput)).rejects.toThrow(
        "Email already exists"
      );

      // Verify only one user exists in database
      const usersCount = await UserModel.countDocuments({
        email: userInput.email,
      });
      expect(usersCount).toBe(1);
    });

    it("should generate different tokens for different users", async () => {
      const userInput1 = createMockUserInput();
      const userInput2 = createMockUserInput();

      const result1 = await authService.registerUser(userInput1);
      const result2 = await authService.registerUser(userInput2);

      expect(result1.token).not.toBe(result2.token);
      expect(result1.user.id).not.toEqual(result2.user.id);
    });

    it("should hash password correctly", async () => {
      const userInput = createMockUserInput();
      const plainPassword = userInput.password;

      await authService.registerUser(userInput);

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

      const result = await authService.registerUser(userInput);

      expect(result.user).not.toHaveProperty("password");
      expect(Object.keys(result.user)).not.toContain("password");
    });
  });

  describe("loginUser", () => {
    it("should login successfully with valid credentials", async () => {
      const userInput = createMockUserInput();

      // Register user first
      const registerResult = await authService.registerUser(userInput);

      // Login with same credentials
      const loginResult = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      expect(loginResult).toHaveProperty("token");
      expect(loginResult).toHaveProperty("user");
      expect(loginResult.user.id).toEqual(registerResult.user.id);
      expect(loginResult.user.email).toBe(userInput.email);
      expect(loginResult.user).not.toHaveProperty("password");

      // Verify token is generated
      expect(loginResult.token).toBeTruthy();
      expect(typeof loginResult.token).toBe("string");
    });

    it("should throw UnauthorizedError when user is not found", async () => {
      const userInput = createMockUserInput();

      await expect(
        authService.loginUser({
          email: userInput.email,
          password: userInput.password,
        })
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.loginUser({
          email: userInput.email,
          password: userInput.password,
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw UnauthorizedError when password is incorrect", async () => {
      const userInput = createMockUserInput();

      // Register user
      await authService.registerUser(userInput);

      // Try to login with wrong password
      await expect(
        authService.loginUser({
          email: userInput.email,
          password: "wrong-password-123",
        })
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.loginUser({
          email: userInput.email,
          password: "wrong-password-123",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should generate valid JWT token on login", async () => {
      const userInput = createMockUserInput();

      await authService.registerUser(userInput);

      const loginResult = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      // Verify token can be verified
      const decoded = jwtService.verify(loginResult.token);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(loginResult.user.id.toString());
    });

    it("should generate valid tokens for same user on different logins", async () => {
      const userInput = createMockUserInput();

      await authService.registerUser(userInput);

      const loginResult1 = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      // Add small delay to ensure different timestamp in JWT
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const loginResult2 = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      // Both tokens should be valid
      const decoded1 = jwtService.verify(loginResult1.token);
      const decoded2 = jwtService.verify(loginResult2.token);
      expect(decoded1).toBeTruthy();
      expect(decoded2).toBeTruthy();
      expect(decoded1?.userId).toBe(loginResult1.user.id.toString());
      expect(decoded2?.userId).toBe(loginResult2.user.id.toString());

      // Tokens should be different (different timestamps/expiration)
      expect(loginResult1.token).not.toBe(loginResult2.token);
      // But user should be the same
      expect(loginResult1.user.id).toEqual(loginResult2.user.id);
    });

    it("should not expose password in returned user object on login", async () => {
      const userInput = createMockUserInput();

      await authService.registerUser(userInput);

      const loginResult = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      expect(loginResult.user).not.toHaveProperty("password");
      expect(Object.keys(loginResult.user)).not.toContain("password");
    });

    it("should work with case-sensitive email", async () => {
      const userInput = createMockUserInput({ email: "Test@Example.com" });

      await authService.registerUser(userInput);

      // Login with different case should fail (MongoDB default is case-sensitive)
      await expect(
        authService.loginUser({
          email: "test@example.com", // different case
          password: userInput.password,
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("Integration between register and login", () => {
    it("should allow user to register and then login immediately", async () => {
      const userInput = createMockUserInput();

      // Register
      const registerResult = await authService.registerUser(userInput);
      expect(registerResult.token).toBeTruthy();

      // Login immediately after registration
      const loginResult = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      expect(loginResult.user.id).toEqual(registerResult.user.id);
      expect(loginResult.user.email).toBe(registerResult.user.email);
    });

    it("should maintain user data consistency between register and login", async () => {
      const userInput = createMockUserInput();

      const registerResult = await authService.registerUser(userInput);
      const loginResult = await authService.loginUser({
        email: userInput.email,
        password: userInput.password,
      });

      // User data should be consistent
      expect(loginResult.user.id).toEqual(registerResult.user.id);
      expect(loginResult.user.email).toEqual(registerResult.user.email);
      expect(loginResult.user.createdAt).toEqual(registerResult.user.createdAt);
    });
  });
});
