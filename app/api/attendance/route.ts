// src/app/api/attendance/route.ts
import { getWorkspaceIdByActivityId } from "@/lib/guard/activity";
import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { db } from "@/lib/prisma";
import { withApi } from "@/lib/withapi";
import { NextResponse } from "next/server";

export const GET = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("activityId");
  const status = searchParams.get("status"); // ACCEPTED / REJECTED / all
  const limit = Number(searchParams.get("limit") ?? "100");
  const cursor = searchParams.get("cursor"); // for pagination

  if (!activityId) {
    return NextResponse.json(
      { error: "activityId is required" },
      { status: 400 }
    );
  }

  // resolve activity → workspace
  const workspaceId = await getWorkspaceIdByActivityId(activityId);

  // semua member boleh lihat
  await ensureWorkspaceAccess(userId, workspaceId);

  const where: any = { activityId };
  if (status && status !== "all") {
    where.status = status;
  }

  const items = await db.attendance.findMany({
    where,
    orderBy: { scannedAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      scannedAt: true,
      scanType: true,
      status: true,
      reason: true,
      participant: {
        select: { id: true, name: true, externalId: true, email: true },
      },
      checkpoint: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const last = items.pop();
    nextCursor = last?.id ?? null;
  }

  return NextResponse.json({
    items,
    nextCursor,
  });
});
