import { Types } from "mongoose";

export function toObjectId(
  value: string | undefined | null
): Types.ObjectId | null {
  if (!value || !Types.ObjectId.isValid(value)) {
    return null;
  }
  return new Types.ObjectId(value);
}
