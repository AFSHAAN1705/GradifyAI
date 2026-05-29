import { z } from "zod";
import { objectIdSchema, paginationSchema, sortDirectionSchema } from "./common.validator";

export const collegeSearchSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  branchCode: z.string().trim().max(24).transform((value) => value.toUpperCase()).optional(),
  sortBy: z.enum(["name", "city", "createdAt", "placementScore"]).default("name"),
  sortDirection: sortDirectionSchema,
  nirfRankMin: z.coerce.number().int().positive().optional(),
  nirfRankMax: z.coerce.number().int().positive().optional(),
  placementPctMin: z.coerce.number().min(0).max(100).optional(),
  hostelAvailable: z.coerce.boolean().optional(),
  autonomous: z.coerce.boolean().optional(),
  avgPackageMin: z.coerce.number().positive().optional(),
  campusType: z.string().trim().max(60).optional(),
  naacGrade: z.string().trim().max(20).optional()
});

export const cutoffSearchSchema = paginationSchema.extend({
  collegeId: objectIdSchema.optional(),
  branchCode: z.string().trim().max(24).transform((value) => value.toUpperCase()).optional(),
  categoryCode: z.string().trim().max(24).transform((value) => value.toUpperCase()).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  round: z.coerce.number().int().min(1).max(10).optional(),
  minRank: z.coerce.number().int().positive().optional(),
  maxRank: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["rankClose", "year", "round", "createdAt"]).default("rankClose"),
  sortDirection: sortDirectionSchema
});

export const predictionRequestSchema = z.object({
  examRank: z.coerce.number().int().positive().max(2_000_000),
  categoryCode: z.string().trim().min(2).max(24).transform((value) => value.toUpperCase()),
  preferredCity: z.string().trim().max(80).optional(),
  round: z.coerce.number().int().min(1).max(3).optional(),
  branchCodes: z
    .array(z.string().trim().min(1).max(24).transform((value) => value.toUpperCase()))
    .max(12)
    .default([]),
  save: z.boolean().default(false)
});

export const reviewSchema = z.object({
  collegeId: objectIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10).max(2_000)
});

export const chatSchema = z.object({
  title: z.string().trim().min(2).max(140).default("Admissions chat"),
  message: z.string().trim().min(1).max(4_000)
});

export type CollegeSearchInput = z.infer<typeof collegeSearchSchema>;
export type CutoffSearchInput = z.infer<typeof cutoffSearchSchema>;
export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
