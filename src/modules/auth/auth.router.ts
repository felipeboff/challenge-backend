import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModel } from "../../database/models/user.model";
import { UserService } from "../users/user.service";
import { UserRepository } from "../users/user.repository";

const router = Router();

const userRepository = new UserRepository(UserModel);
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository, userService);
const authController = new AuthController(authService);

router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
