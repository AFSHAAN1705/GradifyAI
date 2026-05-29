import { predictAdmissions } from "../services/prediction.service";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";

export const predictController = asyncHandler(async (req, res) => {
  const result = await predictAdmissions(req.body, req.user?.id);
  return sendSuccess(res, result, 201);
});
