import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { transformObjectId } from "./transform-object-id";
import { IAuthPayload } from "../modules/auth/auth.type";

export class JwtService {
  private readonly secret = env.JWT_SECRET;
  private readonly expiresInSeconds = env.JWT_EXPIRES_IN_MINUTES * 60;
  private readonly algorithm = env.JWT_ALGORITHM;

  public sign({ userId }: IAuthPayload): string | null {
    try {
      return jwt.sign({ userId }, this.secret, {
        expiresIn: this.expiresInSeconds,
        algorithm: this.algorithm,
      });
    } catch {
      return null;
    }
  }

  public verify(token: string): IAuthPayload | null {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
      });

      if (typeof payload === "object" && payload && "userId" in payload) {
        const userId = transformObjectId(payload.userId);
        if (!userId) return null;
        return { userId };
      }

      return null;
    } catch {
      return null;
    }
  }
}
