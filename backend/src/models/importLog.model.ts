import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const importLogSchema = new Schema(
  {
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true },
    year: { type: Number, required: true, index: true },
    round: { type: Number, required: true, index: true },
    roundLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "PARTIAL"],
      default: "PENDING",
      index: true
    },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    skippedRows: { type: Number, default: 0 },
    errors: [{
      line: String,
      reason: String,
      timestamp: { type: Date, default: Date.now }
    }],
    collegesCreated: [{ type: Schema.Types.ObjectId, ref: "College" }],
    branchesCreated: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    categoriesCreated: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    processingTimeMs: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    fileSize: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true, collection: "import_logs", suppressReservedKeysWarning: true }
);

importLogSchema.index({ fileName: 1, year: 1, round: 1 }, { unique: true });
importLogSchema.index({ status: 1, createdAt: -1 });

export type ImportLogDocument = InferSchemaType<typeof importLogSchema>;
export const ImportLogModel =
  (models.ImportLog as Model<ImportLogDocument> | undefined) || model<ImportLogDocument>("ImportLog", importLogSchema);
