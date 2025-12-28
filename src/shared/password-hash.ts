import bcrypt from "bcrypt";

import { env } from "../config/env";

export class PasswordHash {
  private static readonly saltRounds = env.PASSWORD_SALT;
  private static readonly secret = env.PASSWORD_SECRET;

  static async hash(plainText: string): Promise<string> {
    return await bcrypt.hash(plainText + this.secret, this.saltRounds);
  }

  static async compare(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText + this.secret, hash);
  }
}
