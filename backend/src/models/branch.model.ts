import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const branchSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 24 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    aliases: [{ type: String, trim: true, uppercase: true }]
  },
  { timestamps: true, collection: "branches" }
);

branchSchema.index({ name: "text", code: "text", aliases: "text" });

export type BranchDocument = InferSchemaType<typeof branchSchema>;
export const BranchModel =
  (models.Branch as Model<BranchDocument> | undefined) || model<BranchDocument>("Branch", branchSchema);
