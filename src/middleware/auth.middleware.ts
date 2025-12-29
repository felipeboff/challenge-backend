import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { UserModel } from "../database/models/user.model";
import { UnauthorizedError } from "../shared/app-error";
import { JwtService } from "../shared/jwt-service";
import { UserRepository } from "../modules/users/user.repository";

const userRepository = new UserRepository(UserModel);

export const authMiddleware = async (
  request: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  void _res;

  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Unauthorized", {
      origin: "AuthMiddleware.authMiddleware",
      path: request.path,
      message: "No token provided",
    });
  }

  const decoded = JwtService.verify(token);
  if (!decoded) {
    throw new UnauthorizedError("Unauthorized", {
      origin: "AuthMiddleware.authMiddleware",
      path: request.path,
      message: "Invalid token",
    });
  }

  const userId = decoded.userId ? new Types.ObjectId(decoded.userId) : null;
  const user = userId ? await userRepository.findById(userId) : null;
  if (!user) {
    throw new UnauthorizedError("Unauthorized", {
      origin: "AuthMiddleware.authMiddleware",
      path: request.path,
      message: "User not found",
      userId: decoded.userId,
    });
  }

  request.authContext = { user };

  next();
};
