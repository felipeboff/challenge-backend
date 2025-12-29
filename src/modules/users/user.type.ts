import { Types } from "mongoose";

export interface IUser {
  id: Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSafe extends Omit<IUser, "password"> {}

export interface IUserCreate {
  email: string;
  password: string;
}
