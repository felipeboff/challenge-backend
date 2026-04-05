import { Types } from "mongoose";

import type { IUserSafe } from "../users/user.type";

export interface IAuthUser {
  token: string;
  user: IUserSafe;
}

export interface IAuthPayload {
  userId: Types.ObjectId;
}
