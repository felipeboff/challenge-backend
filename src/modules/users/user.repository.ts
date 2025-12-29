import { Types } from "mongoose";

import { UserModel } from "../../database/models/user.model";
import { IUser } from "./user.type";

export class UserRepository {
  constructor(private readonly userModel: typeof UserModel) {}

  async create(user: IUser): Promise<IUser> {
    const result = await this.userModel.create(user);
    return result.toObject();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const result = await this.userModel.findOne({ email }).lean();
    return result;
  }

  async findById(id: Types.ObjectId): Promise<IUser | null> {
    const result = await this.userModel.findById(id).lean();
    return result;
  }
}
