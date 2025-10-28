import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const getActivityIdByCheckpointId = async (checkpointId: string) => {
  const result = await db.checkpoint.findUnique({
    where: { id: checkpointId },
    select: { activityId: true },
  });

  if (!result) {
    throw NextResponse.json({ error: "Checkpoint not found" }, { status: 404 });
  }

  return result?.activityId;
};
