import { z } from "zod";

export const ParticipantCreateSchema = z.object({
  workspaceId: z.string().min(1),
  externalId: z.string().max(80).optional(),
  name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
});

export const ParticipantUpdateSchema = z.object({
  externalId: z.string().max(80).optional(),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
});

export const ParticipantImportSchema = z.object({
  workspaceId: z.string().min(1),
  // "true" | "false" | undefined → boolean
  dryRun: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
