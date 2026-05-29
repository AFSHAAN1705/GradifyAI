import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { parseUploadedFile } from "../services/upload.service";
import type { UserContext } from "../services/chat.service";
import { chatWithSam } from "../services/chat.service";

export const samUploadFileController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A file is required.", 400, "FILE_REQUIRED");
  }

  const parsed = await parseUploadedFile(req.file.path, req.file.originalname);

  const context: UserContext = {
    rank: req.body.rank ? Number(req.body.rank) : undefined,
    category: req.body.category || undefined,
    district: req.body.district || undefined,
    branches: req.body.branches ? (Array.isArray(req.body.branches) ? req.body.branches : [req.body.branches]) : undefined,
  };

  const analysisMessage = req.body.message || `Analyze this ${parsed.fileType.toUpperCase()} file: "${parsed.fileName}". The file contains the following text:\n\n${parsed.text.slice(0, 8000)}`;

  const result = await chatWithSam({
    conversationId: req.body.conversationId || undefined,
    message: analysisMessage,
    context,
    userId: req.user?.id,
  });

  return sendSuccess(res, {
    ...result,
    fileInfo: {
      name: parsed.fileName,
      type: parsed.fileType,
      size: parsed.fileSize,
    },
  }, 201);
});

export const samUploadImageController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("An image file is required.", 400, "FILE_REQUIRED");
  }

  const context: UserContext = {
    rank: req.body.rank ? Number(req.body.rank) : undefined,
    category: req.body.category || undefined,
  };

  const analysisMessage = req.body.message || `I've uploaded an image: "${req.file.originalname}". Please analyze it and provide insights related to KCET counselling or college admissions if relevant.`;

  const result = await chatWithSam({
    conversationId: req.body.conversationId || undefined,
    message: analysisMessage,
    context,
    userId: req.user?.id,
  });

  return sendSuccess(res, {
    ...result,
    fileInfo: {
      name: req.file.originalname,
      type: "image",
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
    },
  }, 201);
});

export const samUploadVideoController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A video file is required.", 400, "FILE_REQUIRED");
  }

  return sendSuccess(res, {
    message: "Video uploaded successfully. Video content analysis is limited. You can still ask SAM questions alongside your video.",
    fileInfo: {
      name: req.file.originalname,
      type: "video",
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
    },
  }, 201);
});
