import { Types } from "mongoose";
import { PasswordHash } from "../../shared/password-hash";
import { IUser, IUserCreate, IUserRepository, IUserSafe } from "./user.type";
import { ConflictError, NotFoundError } from "../../shared/app-error";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  public async createUser(user: IUserCreate): Promise<IUserSafe> {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new ConflictError("User already exists");
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
      throw new NotFoundError("User not found");
    }

    const { password, ...safeUser } = userFound;
    void password;

    return safeUser;
  }

  public async getUserById(id: Types.ObjectId): Promise<IUserSafe> {
    const userFound = await this.userRepository.findById(id);
    if (!userFound) {
      throw new NotFoundError("User not found");
    }

    const { password, ...safeUser } = userFound;
    void password;

    return safeUser;
  }
}
