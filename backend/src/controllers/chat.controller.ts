import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import {
  chatWithSam,
  getConversationHistory,
  listConversations,
  deleteConversation,
  generateStrategy,
  getSamHealth,
} from "../services/chat.service";
import { KnowledgeBaseModel } from "../models/knowledge-base.model";

export const chatController = asyncHandler(async (req, res) => {
  const conversationId = req.body.conversationId || undefined;
  console.log(`[Chat] Incoming request:`, {
    conversationId: conversationId || "(new)",
    message: req.body.message?.slice(0, 80),
  });
  const result = await chatWithSam({
    conversationId,
    message: req.body.message,
    context: req.body.context,
    userId: req.user?.id,
  });
  return sendSuccess(res, result, 201);
});

export const getHistoryController = asyncHandler(async (req, res) => {
  const conversationId = req.params.id as string;
  const result = await getConversationHistory(conversationId);
  return sendSuccess(res, result);
});

export const listConversationsController = asyncHandler(async (req, res) => {
  if (!req.user?.id) return sendSuccess(res, { conversations: [] });
  const conversations = await listConversations(req.user.id);
  return sendSuccess(res, { conversations });
});

export const deleteConversationController = asyncHandler(async (req, res) => {
  await deleteConversation(req.params.id as string);
  return sendSuccess(res, { deleted: true });
});

export const strategyController = asyncHandler(async (req, res) => {
  const result = await generateStrategy(req.body);
  return sendSuccess(res, result);
});

export const samHealthController = asyncHandler(async (_req, res) => {
  return sendSuccess(res, getSamHealth());
});

export const listKnowledgeController = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search as string };
  const items = await KnowledgeBaseModel.find(filter).sort({ priority: -1, createdAt: -1 }).limit(100).lean();
  return sendSuccess(res, { items });
});

export const createKnowledgeController = asyncHandler(async (req, res) => {
  const item = await KnowledgeBaseModel.create({
    ...req.body,
    createdBy: req.user?.id,
  });
  return sendSuccess(res, item, 201);
});

export const updateKnowledgeController = asyncHandler(async (req, res) => {
  const item = await KnowledgeBaseModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  return sendSuccess(res, item);
});

export const deleteKnowledgeController = asyncHandler(async (req, res) => {
  await KnowledgeBaseModel.findByIdAndDelete(req.params.id);
  return sendSuccess(res, { deleted: true });
});
