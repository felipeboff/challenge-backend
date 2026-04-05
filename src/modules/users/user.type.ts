import { Types } from "mongoose";

export interface IUser {
  id: Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserSafe = Omit<IUser, "password">;

export interface IUserCreate {
  email: string;
  password: string;
}
