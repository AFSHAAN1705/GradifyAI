import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const cutoffSchema = new Schema(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    categoryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    categoryName: { type: String, trim: true },
    year: { type: Number, required: true, index: true },
    round: { type: Number, required: true, index: true },
    roundLabel: { type: String, required: true, trim: true },
    rankOpen: Number,
    rankClose: { type: Number, required: true, min: 1, index: true },
    percentile: Number,
    quota: { type: String, default: "STATE", trim: true, uppercase: true },
    seatType: { type: String, default: "", trim: true },
    source: { type: String, trim: true },
    sourceLine: { type: String, trim: true }
  },
  { timestamps: true, collection: "cutoffs" }
);

cutoffSchema.index(
  { collegeId: 1, branchId: 1, categoryCode: 1, year: 1, round: 1, quota: 1, seatType: 1 },
  { unique: true }
);
cutoffSchema.index({ categoryCode: 1, year: -1, round: 1, rankClose: 1 });
cutoffSchema.index({ collegeId: 1, year: -1, round: 1 });

export type CutoffDocument = InferSchemaType<typeof cutoffSchema>;
export const CutoffModel =
  (models.Cutoff as Model<CutoffDocument> | undefined) || model<CutoffDocument>("Cutoff", cutoffSchema);
