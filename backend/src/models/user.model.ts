import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["STUDENT", "ADMIN"], default: "STUDENT", index: true },
    image: { type: String, trim: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true, collection: "users" }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel =
  (models.User as Model<UserDocument> | undefined) || model<UserDocument>("User", userSchema);
