import { Types } from "mongoose";

export function transformObjectId(value: unknown): Types.ObjectId | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Types.ObjectId) return value;
  if (typeof value !== "string") return undefined;
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0 || trimmedValue.length !== 24) return undefined;
  if (!Types.ObjectId.isValid(trimmedValue)) return undefined;

  try {
    return new Types.ObjectId(trimmedValue);
  } catch {
    return undefined;
  }
}
