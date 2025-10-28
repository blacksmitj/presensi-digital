import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const getWorkspaceIdByActivityId = async (activityId: string) => {
  const result = await db.activity.findUnique({
    where: { id: activityId },
    select: { workspaceId: true },
  });

  if (!result) {
    throw NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  return result?.workspaceId;
};
