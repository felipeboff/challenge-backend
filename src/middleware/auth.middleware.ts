import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import { UserModel } from "../database/models/user.model";
import { UnauthorizedError } from "../shared/app-error";
import { JwtService } from "../shared/jwt-service";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  void _res;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Unauthorized");
  }

  const decoded = JwtService.verify(token);
  if (!decoded) {
    throw new UnauthorizedError("Unauthorized");
  }

  const userId = decoded.userId ? new Types.ObjectId(decoded.userId) : null;
  const user = userId ? await UserModel.findById(userId) : null;
  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  req.authContext = { user: user.toObject() };

  next();
};
