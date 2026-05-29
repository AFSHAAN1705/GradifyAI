import { searchColleges, getCollegeById } from "../services/college.service";
import { sendSuccess } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";

export const listCollegesController = asyncHandler(async (req, res) => {
  const result = await searchColleges(req.query as never);
  return sendSuccess(
    res,
    {
      colleges: result.items,
      categories: result.categories
    },
    200,
    {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  );
});

export const getCollegeDetailController = asyncHandler(async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const college = await getCollegeById(id ?? "");
  return sendSuccess(res, college);
});
