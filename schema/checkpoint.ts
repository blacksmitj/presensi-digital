import { z } from "zod";

export const CheckpointCreateSchema = z.object({
  activityId: z.string().min(1),
  name: z.string().min(2).max(80),
});

export const CheckpointDeleteSchema = z.object({
  id: z.string().min(1),
});
