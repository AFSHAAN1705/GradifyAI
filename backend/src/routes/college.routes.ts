import { Router } from "express";
import { listCollegesController, getCollegeDetailController } from "../controllers/college.controller";
import { validate } from "../middleware/validate";
import { collegeSearchSchema } from "../validators/admissions.validator";

export const collegeRoutes = Router();

collegeRoutes.get("/", validate(collegeSearchSchema, "query"), listCollegesController);
collegeRoutes.get("/:id", getCollegeDetailController);
