import { Document, Types } from "mongoose";

import { UserModel } from "../../database/models/user.model";
import { IUser } from "./user.type";
import { NotFoundError } from "../../shared/app-error";

export interface IUserDocument extends Omit<IUser, "id"> {
  _id: Types.ObjectId;
}

export const toDocumentUser = (user: IUser): IUserDocument => {
  const { id: _id, ...rest } = user;
  return {
    ...rest,
    _id,
  };
};

export const toObjectUser = (user: unknown): IUser => {
  const { _id: id, ...rest } = user as IUserDocument;
  return {
    ...rest,
    id,
  };
};
export class UserRepository {
  constructor(private readonly userModel: typeof UserModel) {}

  async create(user: IUser): Promise<IUser> {
    const documentUser = toDocumentUser(user);
    const result = await this.userModel.create(documentUser);
    return toObjectUser(result.toObject());
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const result = await this.userModel.findOne({ email }).lean();
    if (!result) {
      return null;
    }
    return toObjectUser(result);
  }

  async findById(userId: Types.ObjectId): Promise<IUser> {
    const result = await this.userModel.findById(userId).lean();
    if (!result) {
      throw new NotFoundError("User not found", {
        origin: "UserRepository.findById",
        userId,
      });
    }
    return toObjectUser(result);
  }
}
