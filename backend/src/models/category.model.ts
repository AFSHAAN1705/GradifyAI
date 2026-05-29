import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const categorySchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 24 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    group: { type: String, trim: true, maxlength: 80 },
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true, collection: "categories" }
);

export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export const CategoryModel =
  (models.Category as Model<CategoryDocument> | undefined) || model<CategoryDocument>("Category", categorySchema);
