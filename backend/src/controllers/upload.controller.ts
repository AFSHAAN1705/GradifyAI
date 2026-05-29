import { ingestCutoffPdf } from "../services/pdf-ingestion.service";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";

export const uploadPdfController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A PDF file is required.", 400, "FILE_REQUIRED");
  }

  const result = await ingestCutoffPdf({
    filePath: req.file.path,
    originalName: req.file.originalname,
    year: req.body.year ? Number(req.body.year) : undefined,
    round: req.body.round ? Number(req.body.round) : undefined
  });

  return sendSuccess(res, result, 201);
});
