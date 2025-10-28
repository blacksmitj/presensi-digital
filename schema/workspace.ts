import { z } from "zod";

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(3).max(120),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  defaultRole: z.enum(["OWNER", "ADMIN", "SUPERVISOR", "STAFF"]).optional(),
});

export const WorkspaceUpdateSchema = z.object({
  name: z.string().min(3).max(120).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  defaultRole: z.enum(["OWNER", "ADMIN", "SUPERVISOR", "STAFF"]).optional(),
});

export const WorkspaceStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export const JoinCodeSchema = z.object({
  code: z
    .string()
    .min(4)
    .max(32)
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => /^[A-Z0-9-]+$/.test(s), "Invalid code format"),
});
