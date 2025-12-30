import { Router } from "express";

import { UserModel } from "../../database/models/user.model";
import { UserRepository } from "../users/user.repository";
import { UserService } from "../users/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtService } from "../../shared/jwt-service";
import { PasswordHash } from "../../shared/password-hash";

const router = Router();

const passwordHash = new PasswordHash();
const jwtService = new JwtService();
const userRepository = new UserRepository(UserModel);
const userService = new UserService(userRepository, passwordHash);
const authService = new AuthService(
  userRepository,
  userService,
  jwtService,
  passwordHash
);
const authController = new AuthController(authService);

router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
