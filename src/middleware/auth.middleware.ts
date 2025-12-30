import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { UnauthorizedError } from "../shared/app-error";
import {
  JwtService,
  type JwtService as IJwtService,
} from "../shared/jwt-service";
import {
  UserRepository,
  type UserRepository as IUserRepository,
} from "../modules/users/user.repository";
import { UserModel } from "../database/models/user.model";

class AuthMiddleware {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  public handle = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    void response;

    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Unauthorized", {
        origin: "AuthMiddleware.handle",
        path: request.path,
        message: "No token provided",
      });
    }

    const decoded = this.jwtService.verify(token);
    if (!decoded) {
      throw new UnauthorizedError("Unauthorized", {
        origin: "AuthMiddleware.handle",
        path: request.path,
        message: "Invalid token",
      });
    }

    const userId = decoded.userId ? new Types.ObjectId(decoded.userId) : null;
    const user = userId ? await this.userRepository.findById(userId) : null;
    if (!user) {
      throw new UnauthorizedError("Unauthorized", {
        origin: "AuthMiddleware.handle",
        path: request.path,
        message: "User not found",
        userId: decoded.userId,
      });
    }

    request.authContext = { user };

    next();
  };
}

const userRepository = new UserRepository(UserModel);
const jwtService = new JwtService();
export default new AuthMiddleware(userRepository, jwtService).handle;
