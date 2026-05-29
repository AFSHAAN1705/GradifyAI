import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const knowledgeBaseSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["counselling_tip", "placement_insight", "college_review", "branch_advice", "district_info", "strategy", "faq", "system_prompt"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true },
    tags: [{ type: String }],
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "knowledge_base" }
);

knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ category: 1, isActive: 1 });
knowledgeBaseSchema.index({ title: "text", content: "text", tags: "text" });

export type KnowledgeBaseDocument = InferSchemaType<typeof knowledgeBaseSchema>;
export const KnowledgeBaseModel =
  (models.KnowledgeBase as Model<KnowledgeBaseDocument> | undefined) || model<KnowledgeBaseDocument>("KnowledgeBase", knowledgeBaseSchema);
