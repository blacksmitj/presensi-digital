import { NextResponse } from "next/server";
import { AttendanceStatus, ActivityStatus, ScanType } from "@prisma/client";
import { requireSession } from "@/lib/guard/auth";
import { db } from "@/lib/prisma";
import { AttendanceScanSchema } from "@/schema/attendance";

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => ({}));
  const parsed = AttendanceScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const {
    activityId,
    participantRef,
    checkpointCode,
    scanType,
    requestId,
    scannedAt,
    offline,
  } = parsed.data;

  // 1) activity
  const activity = await db.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      workspaceId: true,
      status: true,
      startAt: true,
      endAt: true,
      rules: true,
    },
  });
  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (
    activity.status !== ActivityStatus.SCHEDULED &&
    activity.status !== ActivityStatus.ONGOING
  ) {
    return NextResponse.json(
      { error: "Activity is not active" },
      { status: 400 }
    );
  }

  // 2) panitia harus ditugaskan di activity ini
  const assignment = await db.activityAssignment.findFirst({
    where: {
      activityId,
      userId,
    },
    select: { id: true },
  });
  if (!assignment) {
    return NextResponse.json(
      { error: "You are not assigned to this activity" },
      { status: 403 }
    );
  }

  // 3) participant dari qrRef
  const participant = await db.participant.findFirst({
    where: {
      workspaceId: activity.workspaceId,
      qrRef: participantRef,
    },
    select: { id: true },
  });
  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found" },
      { status: 404 }
    );
  }

  // 4) checkpoint (opsional)
  let checkpointId: string | null = null;
  if (checkpointCode) {
    const checkpoint = await db.checkpoint.findFirst({
      where: {
        activityId,
        code: checkpointCode,
      },
      select: { id: true },
    });
    if (!checkpoint) {
      return NextResponse.json(
        { error: "Checkpoint not found for this activity" },
        { status: 404 }
      );
    }
    checkpointId = checkpoint.id;
  }

  // 5) idempotensi → di schema kamu requestId unik → kalau sudah pernah kirim requestId ini, balikin saja
  const existing = await db.attendance.findUnique({
    where: { requestId },
    select: {
      id: true,
      status: true,
      reason: true,
      scanType: true,
      scannedAt: true,
    },
  });
  if (existing) {
    return NextResponse.json({
      message: "Already recorded",
      attendance: existing,
    });
  }

  // 6) tentukan scanType kalau tidak dikirim
  let finalScanType: ScanType;
  if (scanType) {
    // sudah dikirim oleh client
    finalScanType = scanType as ScanType;
  } else {
    // auto: cek apakah sudah pernah IN
    const hasIn = await db.attendance.findFirst({
      where: {
        activityId,
        participantId: participant.id,
        scanType: "IN",
        status: AttendanceStatus.ACCEPTED,
      },
      select: { id: true },
    });
    finalScanType = hasIn ? "OUT" : "IN";
  }

  // 7) validasi window waktu (sederhana)
  const now = scannedAt ?? new Date();
  let status: AttendanceStatus = AttendanceStatus.ACCEPTED;
  let reason: string | null = null;

  // jika scan di luar rentang activity → tandai REJECTED
  if (activity.startAt && now < activity.startAt) {
    status = AttendanceStatus.REJECTED;
    reason = "BEFORE_ACTIVITY";
  } else if (activity.endAt && now > activity.endAt) {
    status = AttendanceStatus.REJECTED;
    reason = "AFTER_ACTIVITY";
  }

  // contoh reject double OUT
  if (status === AttendanceStatus.ACCEPTED && finalScanType === "OUT") {
    const hasOut = await db.attendance.findFirst({
      where: {
        activityId,
        participantId: participant.id,
        scanType: "OUT",
        status: AttendanceStatus.ACCEPTED,
      },
      select: { id: true },
    });
    if (hasOut) {
      status = AttendanceStatus.REJECTED;
      reason = "DOUBLE_OUT";
    }
  }

  // 8) simpan
  const attendance = await db.attendance.create({
    data: {
      id: undefined, // biarkan prisma generate
      participantId: participant.id,
      activityId,
      checkpointId: checkpointId ?? undefined,
      scanType: finalScanType,
      scannedAt: now,
      status,
      reason,
      requestId, // WAJIB karena schema kamu wajib + unique
      offline: offline ?? false,
      staffAssignmentId: assignment.id,
    },
    select: {
      id: true,
      scanType: true,
      status: true,
      reason: true,
      scannedAt: true,
      checkpointId: true,
    },
  });

  return NextResponse.json({
    message:
      status === AttendanceStatus.ACCEPTED
        ? "Recorded"
        : "Recorded with rejection",
    attendance,
  });
}
