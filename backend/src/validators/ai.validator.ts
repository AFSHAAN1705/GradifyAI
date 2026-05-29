import { z } from "zod";

export const aiCounsellingSchema = z.object({
  message: z.string().trim().min(3).max(4_000),
  context: z
    .object({
      rank: z.coerce.number().int().positive().optional(),
      category: z.string().trim().max(24).optional(),
      branches: z.array(z.string().trim().max(80)).max(12).optional(),
      colleges: z.array(z.string().trim().max(160)).max(12).optional(),
      round: z.coerce.number().int().min(1).max(3).optional()
    })
    .optional()
});

export const comparisonSchema = z.object({
  optionA: z.string().trim().min(2).max(200),
  optionB: z.string().trim().min(2).max(200),
  rank: z.coerce.number().int().positive().optional(),
  category: z.string().trim().max(24).optional()
});

const contextFields = z.object({
  rank: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  category: z.string().trim().max(24).optional(),
  district: z.string().trim().max(80).optional(),
  branches: z.array(z.string().trim().max(80)).max(12).optional(),
  budget: z.union([z.coerce.number().positive(), z.null()]).optional(),
  hostel: z.boolean().optional()
}).optional();

export const chatSchema = z.object({
  conversationId: z.string().nullish(),
  message: z.string().trim().min(1).max(10_000),
  context: contextFields,
});

export const strategySchema = z.object({
  rank: z.coerce.number().int().positive(),
  category: z.string().trim().max(24).optional(),
  district: z.string().trim().max(80).optional(),
  branches: z.array(z.string().trim().max(80)).max(12).optional()
});

export const knowledgeSchema = z.object({
  category: z.enum(["counselling_tip", "placement_insight", "college_review", "branch_advice", "district_info", "strategy", "faq", "system_prompt"]),
  title: z.string().trim().min(2).max(200),
  content: z.string().trim().min(10).max(10_000),
  tags: z.array(z.string().trim()).max(20).default([]),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true)
});
