import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 2_000 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING", index: true }
  },
  { timestamps: true, collection: "reviews" }
);

reviewSchema.index({ collegeId: 1, createdAt: -1 });

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;
export const ReviewModel =
  (models.Review as Model<ReviewDocument> | undefined) || model<ReviewDocument>("Review", reviewSchema);
