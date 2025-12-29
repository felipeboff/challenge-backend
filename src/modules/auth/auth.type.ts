import type { IUserSafe } from "../users/user.type";

export interface IAuthUser {
  token: string;
  user: IUserSafe;
}
