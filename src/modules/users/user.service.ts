import { Types } from "mongoose";

import { BadRequestError, NotFoundError } from "../../shared/app-error";
import { PasswordHash } from "../../shared/password-hash";
import type { UserRepository } from "./user.repository";
import type { IUser, IUserCreate, IUserSafe } from "./user.type";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async createUser(user: IUserCreate): Promise<IUserSafe> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new BadRequestError("Email already exists", {
        origin: "UserService.createUser",
        email: user.email,
      });
    }

    const hashedPassword = await PasswordHash.hash(user.password);
    const now = new Date();

    const userData: IUser = {
      _id: new Types.ObjectId(),
      email: user.email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await this.userRepository.create(userData);
    const { password, ...safeUser } = createdUser;
    void password;

    return safeUser;
  }

  public async getUserByEmail(email: string): Promise<IUserSafe> {
    const userFound = await this.userRepository.findByEmail(email);
    if (!userFound) {
      throw new NotFoundError("User not found", {
        origin: "UserService.getUserByEmail",
        email,
      });
    }

    const { password, ...safeUser } = userFound;
    void password;

    return safeUser;
  }

  public async getUserById(userId: Types.ObjectId): Promise<IUserSafe> {
    const userFound = await this.userRepository.findById(userId);
    if (!userFound) {
      throw new NotFoundError("User not found", {
        origin: "UserService.getUserById",
        userId,
      });
    }

    const { password, ...safeUser } = userFound;
    void password;

    return safeUser;
  }
}
