import mongoose from "mongoose";
import { IUser } from "../../modules/users/user.type";

const userSchema = new mongoose.Schema<IUser>(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    password: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
