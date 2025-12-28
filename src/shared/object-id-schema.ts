import { Types } from "mongoose";
import z from "zod";

export const ObjectIdSchema = (val: unknown): Types.ObjectId | undefined => {
  if (
    typeof val !== "string" ||
    val === undefined ||
    val === null ||
    val.trim() === "" ||
    !Types.ObjectId.isValid(val)
  ) {
    return undefined;
  }
  return new Types.ObjectId(val);
};

export const ObjectIdSchemaZod = z.custom<Types.ObjectId>(ObjectIdSchema, {
  message: "Invalid Object ID",
});
