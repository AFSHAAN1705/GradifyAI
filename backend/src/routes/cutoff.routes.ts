import { Router } from "express";
import { listCutoffsController } from "../controllers/cutoff.controller";
import { validate } from "../middleware/validate";
import { cutoffSearchSchema } from "../validators/admissions.validator";

export const cutoffRoutes = Router();

cutoffRoutes.get("/", validate(cutoffSearchSchema, "query"), listCutoffsController);
