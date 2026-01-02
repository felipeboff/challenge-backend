import type { IUserSafe } from "../users/user.type";
import { Types } from "mongoose";

export interface IAuthUser {
  token: string;
  user: IUserSafe;
}

export interface IAuthPayload {
  userId: Types.ObjectId;
}
