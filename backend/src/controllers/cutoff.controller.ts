import { searchCutoffs } from "../services/cutoff.service";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";

export const listCutoffsController = asyncHandler(async (req, res) => {
  const result = await searchCutoffs(req.query as never);
  return sendSuccess(res, { cutoffs: result.items }, 200, {
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  });
});
