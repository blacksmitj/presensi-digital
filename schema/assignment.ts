import { z } from "zod";

export const AssignmentListSchema = z.object({
  activityId: z.string().min(1),
});

export const AssignmentCreateSchema = z.object({
  activityId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1),
  roleNote: z.string().max(120).optional(),
});

export const AssignmentDeleteSchema = z.object({
  id: z.string().min(1),
});
