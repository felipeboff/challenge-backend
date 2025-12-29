import { IUser } from "../modules/users/user.type";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      authContext?: {
        user: IUser;
      };
    }
  }
}

export {};
