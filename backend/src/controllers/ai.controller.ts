import { compareKcetOptions, generateCounsellingAdvice } from "../services/ai.service";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";

export const counsellingController = asyncHandler(async (req, res) => {
  const result = await generateCounsellingAdvice({
    ...req.body,
    userId: req.user?.id
  });
  return sendSuccess(res, result, 201);
});

export const compareController = asyncHandler(async (req, res) => {
  const result = await compareKcetOptions({
    ...req.body,
    userId: req.user?.id
  });
  return sendSuccess(res, result, 201);
});
