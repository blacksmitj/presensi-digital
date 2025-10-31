import { db } from "@/lib/prisma";
import { withApi } from "@/lib/withapi";
import { NextResponse } from "next/server";
import { AttendanceStatus } from "@prisma/client";
import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";

export const GET = withApi(async (_req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { activityId } = ctx?.params ?? {};

  if (!activityId) {
    return NextResponse.json(
      { error: "activityId is required" },
      { status: 400 }
    );
  }

  // 1) resolve activity → workspace
  const activity = await db.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      startAt: true,
      endAt: true,
    },
  });
  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  // 2) semua member boleh lihat report
  await ensureWorkspaceAccess(userId, activity.workspaceId);

  // 3) jalankan beberapa count paralel
  const [
    totalScans,
    accepted,
    rejected,
    inCount,
    outCount,
    byCheckpointRaw,
    lastScan,
  ] = await Promise.all([
    db.attendance.count({
      where: { activityId },
    }),
    db.attendance.count({
      where: { activityId, status: AttendanceStatus.ACCEPTED },
    }),
    db.attendance.count({
      where: { activityId, status: AttendanceStatus.REJECTED },
    }),
    db.attendance.count({
      where: {
        activityId,
        status: AttendanceStatus.ACCEPTED,
        scanType: "IN",
      },
    }),
    db.attendance.count({
      where: {
        activityId,
        status: AttendanceStatus.ACCEPTED,
        scanType: "OUT",
      },
    }),
    // group by checkpoint
    db.attendance.groupBy({
      by: ["checkpointId"],
      where: { activityId },
      _count: { _all: true },
    }),
    db.attendance.findFirst({
      where: { activityId },
      orderBy: { scannedAt: "desc" },
      select: {
        scannedAt: true,
        participant: { select: { name: true, externalId: true } },
        checkpoint: { select: { name: true, code: true } },
        status: true,
        reason: true,
      },
    }),
  ]);

  // 4) ambil nama checkpoint
  const checkpointIds = byCheckpointRaw
    .map((r) => r.checkpointId)
    .filter(Boolean) as string[];

  const checkpoints =
    checkpointIds.length > 0
      ? await db.checkpoint.findMany({
          where: { id: { in: checkpointIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

  const byCheckpoint = byCheckpointRaw.map((r) => {
    const cp = checkpoints.find((c) => c.id === r.checkpointId);
    return {
      checkpointId: r.checkpointId,
      checkpointName: cp?.name ?? null,
      checkpointCode: cp?.code ?? null,
      count: r._count._all,
    };
  });

  return NextResponse.json({
    activity: {
      id: activity.id,
      name: activity.name,
      startAt: activity.startAt,
      endAt: activity.endAt,
    },
    summary: {
      totalScans,
      accepted,
      rejected,
      inCount,
      outCount,
    },
    byCheckpoint,
    lastScan,
  });
});
