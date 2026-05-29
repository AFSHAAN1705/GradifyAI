import { z } from "zod";
import { paginationSchema, sortDirectionSchema } from "@/lib/validation/common";

export const collegeSearchSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  branchCode: z.string().trim().max(24).optional(),
  sortBy: z.enum(["name", "city", "rankClose"]).default("name"),
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

export const analyticsEventSchema = z.object({
  name: z.string().trim().min(2).max(80),
  path: z.string().trim().min(1).max(240),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const savedPreferenceSchema = z.object({
  collegeId: z.string().min(8).optional(),
  branchId: z.string().min(8).optional(),
  label: z.string().trim().min(2).max(120),
  priority: z.coerce.number().int().min(0).max(100).default(0)
}).refine((value) => value.collegeId || value.branchId, {
  message: "At least one of collegeId or branchId is required."
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(128)
});

export type CollegeSearchInput = z.infer<typeof collegeSearchSchema>;
export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type SavedPreferenceInput = z.infer<typeof savedPreferenceSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
