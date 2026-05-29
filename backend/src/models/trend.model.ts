import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const trendSchema = new Schema(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    metric: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, index: true },
    value: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true, collection: "trends" }
);

trendSchema.index({ metric: 1, year: -1 });

export type TrendDocument = InferSchemaType<typeof trendSchema>;
export const TrendModel =
  (models.Trend as Model<TrendDocument> | undefined) || model<TrendDocument>("Trend", trendSchema);
