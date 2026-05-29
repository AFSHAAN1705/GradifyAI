import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import {
  getEnhancedCollegeDetail,
  getDistrictColleges,
  compareColleges,
  verifyPlacement,
} from "../services/college-intelligence.service";

export const getEnhancedCollegeDetailController = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const college = await getEnhancedCollegeDetail(id ?? "");
  return sendSuccess(res, college);
});

export const getDistrictCollegesController = asyncHandler(async (req, res) => {
  const district = Array.isArray(req.params.district) ? req.params.district[0] : req.params.district;
  const result = await getDistrictColleges(district ?? "");
  return sendSuccess(res, result);
});

export const compareCollegesController = asyncHandler(async (req, res) => {
  const ids = req.query.ids as string | undefined;
  if (!ids) return sendSuccess(res, { comparison: [] });
  const collegeIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
  const result = await compareColleges(collegeIds);
  return sendSuccess(res, { comparison: result });
});

export const verifyPlacementController = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await verifyPlacement(id ?? "");
  return sendSuccess(res, result);
});
