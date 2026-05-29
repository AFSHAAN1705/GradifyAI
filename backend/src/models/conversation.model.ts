import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const messageContextSchema = new Schema(
  {
    rank: { type: Number },
    category: { type: String },
    district: { type: String },
    branches: [{ type: String }],
    budget: { type: Number },
    hostel: { type: Boolean },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["USER", "ASSISTANT", "SYSTEM"], required: true },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    context: { type: messageContextSchema },
  },
  { timestamps: true, _id: true }
);

const conversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, default: "New chat", maxlength: 200 },
    context: { type: messageContextSchema },
    messages: [messageSchema],
    provider: { type: String, enum: ["gemini", "openai", "fallback"], default: "fallback" },
  },
  { timestamps: true, collection: "conversations" }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

// Strip null/empty values from context before save
function cleanContextFields(this: Record<string, unknown>) {
  if (this.context && typeof this.context === "object") {
    const ctx = this.context as Record<string, unknown>;
    for (const key of Object.keys(ctx)) {
      if (ctx[key] === null || ctx[key] === undefined || ctx[key] === "") {
        delete ctx[key];
      }
    }
  }
}
conversationSchema.pre("save", function (next) {
  cleanContextFields.call(this as any);
  next();
});

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const ConversationModel =
  (models.Conversation as Model<ConversationDocument> | undefined) || model<ConversationDocument>("Conversation", conversationSchema);
