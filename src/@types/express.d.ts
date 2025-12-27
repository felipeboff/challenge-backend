import { IUser } from "../modules/users/user.type";

declare global {
  namespace Express {
    interface Request {
      authContext?: {
        user: IUser;
      };
    }
  }
}

export {};
