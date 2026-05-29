import { AiChatModel } from "../models/ai-chat.model";
import { CategoryModel } from "../models/category.model";
import { CollegeModel } from "../models/college.model";
import { PlacementModel } from "../models/placement.model";
import { ReviewModel } from "../models/review.model";
import { TrendModel } from "../models/trend.model";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { ALL_DISTRICTS } from "../config/constants";

export const healthController = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    service: "gradify-ai-backend",
    status: "ok",
    time: new Date().toISOString()
  });
});

export const listPlacementsController = asyncHandler(async (req, res) => {
  const items = await PlacementModel.find(req.query.collegeId ? { collegeId: req.query.collegeId } : {})
    .sort({ academicYear: -1 })
    .limit(100)
    .lean();
  return sendSuccess(res, { placements: items });
});

export const listTrendsController = asyncHandler(async (_req, res) => {
  const items = await TrendModel.find({}).sort({ year: -1 }).limit(100).lean();
  return sendSuccess(res, { trends: items });
});

export const listReviewsController = asyncHandler(async (req, res) => {
  const filter = req.query.collegeId ? { collegeId: req.query.collegeId, status: "APPROVED" } : { status: "APPROVED" };
  const items = await ReviewModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  return sendSuccess(res, { reviews: items });
});

export const createReviewController = asyncHandler(async (req, res) => {
  const review = await ReviewModel.create({
    ...req.body,
    userId: req.user?._id,
    status: req.user?.role === "ADMIN" ? "APPROVED" : "PENDING"
  });
  return sendSuccess(res, { review }, 201);
});

export const createChatController = asyncHandler(async (req, res) => {
  const chat = await AiChatModel.create({
    userId: req.user?._id,
    title: req.body.title,
    messages: [
      { role: "USER", content: req.body.message },
      {
        role: "ASSISTANT",
        content:
          "I saved your question. Connect your preferred AI provider in this service layer to generate live answers."
      }
    ]
  });

  return sendSuccess(res, { chat }, 201);
});

export const listChatsController = asyncHandler(async (req, res) => {
  const chats = await AiChatModel.find(req.user ? { userId: req.user._id } : {})
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  return sendSuccess(res, { chats });
});

export const listCategoriesController = asyncHandler(async (_req, res) => {
  const categories = await CategoryModel.find({}).sort({ code: 1 }).lean();
  return sendSuccess(res, {
    categories: categories.map((c) => ({ id: c._id.toString(), code: c.code, name: c.name, group: c.group ?? null }))
  });
});

export const listDistrictsController = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { districts: [...ALL_DISTRICTS].sort() });
});
