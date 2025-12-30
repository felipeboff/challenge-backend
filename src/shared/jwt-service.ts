import jwt, { JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";

export class JwtService {
  private readonly secret = env.JWT_SECRET;
  private readonly expiresInSeconds = env.JWT_EXPIRES_IN_MINUTES * 60;
  private readonly algorithm = env.JWT_ALGORITHM;

  public sign(payload: object): string | null {
    try {
      return jwt.sign(payload, this.secret, {
        expiresIn: this.expiresInSeconds,
        algorithm: this.algorithm,
      });
    } catch {
      return null;
    }
  }

  public verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
      }) as JwtPayload;
    } catch {
      return null;
    }
  }
}
