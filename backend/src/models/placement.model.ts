import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const placementSchema = new Schema(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    academicYear: { type: String, required: true, trim: true, index: true },
    medianPackageLpa: Number,
    averagePackageLpa: Number,
    highestPackageLpa: Number,
    placementRate: Number,
    placementPercentage: Number,
    internshipPercentage: Number,
    avgStipend: Number,
    recruiters: [{ type: String, trim: true }],
    topRecruiters: [{ type: String, trim: true }],
    massRecruiters: [{ type: String, trim: true }],
    totalStudents: Number,
    studentsPlaced: Number,
    studentsInternship: Number,
    verified: { type: Boolean, default: false },
    verificationSource: { type: String, trim: true, maxlength: 200, default: "" },
    confidenceScore: { type: Number }
  },
  { timestamps: true, collection: "placements" }
);

placementSchema.index({ collegeId: 1, branchId: 1, academicYear: 1 }, { unique: true });

export type PlacementDocument = InferSchemaType<typeof placementSchema>;
export const PlacementModel =
  (models.Placement as Model<PlacementDocument> | undefined) || model<PlacementDocument>("Placement", placementSchema);
