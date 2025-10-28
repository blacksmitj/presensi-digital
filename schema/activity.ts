import { z } from "zod";

export const ActivityRulesSchema = z.object({
  graceIn: z.number().int().min(0).default(10), // menit
  minDuration: z.number().int().min(0).default(30), // menit
  requireOut: z.boolean().default(true),
  autoClose: z.boolean().default(true),
});

export const ActivityCreateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(3).max(120),
  location: z.string().max(160).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  rules: ActivityRulesSchema.optional(),
});

export const ActivityUpdateSchema = z.object({
  name: z.string().min(3).max(120).optional(),
  location: z.string().max(160).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  rules: ActivityRulesSchema.optional(),
});
