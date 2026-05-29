import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const predictionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    examRank: { type: Number, required: true, index: true },
    categoryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    preferredCity: { type: String, trim: true },
    branchCodes: [{ type: String, uppercase: true, trim: true }],
    status: { type: String, enum: ["DRAFT", "SAVED"], default: "DRAFT", index: true },
    result: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true, collection: "predictions" }
);

predictionSchema.index({ userId: 1, createdAt: -1 });
predictionSchema.index({ examRank: 1, categoryCode: 1 });

export type PredictionDocument = InferSchemaType<typeof predictionSchema>;
export const PredictionModel =
  (models.Prediction as Model<PredictionDocument> | undefined) ||
  model<PredictionDocument>("Prediction", predictionSchema);
