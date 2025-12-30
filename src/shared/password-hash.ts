import bcrypt from "bcrypt";

import { env } from "../config/env";

export class PasswordHash {
  private readonly saltRounds = env.PASSWORD_SALT;
  private readonly secret = env.PASSWORD_SECRET;

  public async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText + this.secret, this.saltRounds);
  }

  public async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText + this.secret, hash);
  }
}
