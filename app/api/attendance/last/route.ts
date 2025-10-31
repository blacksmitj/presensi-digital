// src/app/api/attendance/last/route.ts
import { NextResponse } from "next/server";
import { withApi } from "@/lib/withapi";
import { requireSession } from "@/lib/guard/auth";
import { getWorkspaceIdByActivityId } from "@/lib/guard/activity";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { db } from "@/lib/prisma";

export const GET = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("activityId");

  if (!activityId) {
    return NextResponse.json(
      { error: "activityId is required" },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceIdByActivityId(activityId);

  await ensureWorkspaceAccess(userId, workspaceId);

  const items = await db.attendance.findMany({
    where: { activityId },
    orderBy: { scannedAt: "desc" },
    take: 20,
    select: {
      id: true,
      scanType: true,
      status: true,
      reason: true,
      scannedAt: true,
      participant: { select: { name: true, externalId: true } },
      checkpoint: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json({ items });
});
