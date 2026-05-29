import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["USER", "ASSISTANT", "SYSTEM"], required: true },
    content: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true, _id: true }
);

const aiChatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    messages: [messageSchema]
  },
  { timestamps: true, collection: "ai_chats" }
);

aiChatSchema.index({ userId: 1, updatedAt: -1 });

export type AiChatDocument = InferSchemaType<typeof aiChatSchema>;
export const AiChatModel =
  (models.AiChat as Model<AiChatDocument> | undefined) || model<AiChatDocument>("AiChat", aiChatSchema);
