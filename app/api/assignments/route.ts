import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/guard/auth";
import {
  AssignmentCreateSchema,
  AssignmentListSchema,
} from "@/schema/assignment";
import { db } from "@/lib/prisma";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { withApi } from "@/lib/withapi";
import { getWorkspaceIdByActivityId } from "@/lib/guard/activity";

export const GET = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { searchParams } = new URL(req.url);
  const parsed = AssignmentListSchema.safeParse({
    activityId: searchParams.get("activityId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { activityId } = parsed.data;

  // resolve activity → workspace
  const workspaceId = await getWorkspaceIdByActivityId(activityId);

  // siapa pun member workspace boleh melihat panitia aktivitas ini
  await ensureWorkspaceAccess(userId, workspaceId);

  const items = await db.activityAssignment.findMany({
    where: { activityId },
    orderBy: { assignedAt: "asc" },
    select: {
      id: true,
      roleNote: true,
      assignedAt: true,
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json({ items });
});

export const POST = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => ({}));
  const parsed = AssignmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const { activityId, userIds, roleNote } = parsed.data;

  // resolve activity → workspace
  const activity = await db.activity.findUnique({
    where: { id: activityId },
    select: { workspaceId: true },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  // hanya OWNER/ADMIN yang boleh assign
  await ensureWorkspaceAccess(userId, activity.workspaceId, [
    Role.OWNER,
    Role.ADMIN,
  ]);

  // buat assignment satu per satu, tapi abaikan yang sudah ada (karena @@unique(activityId,userId))
  // ambil semua member yang bener2 ada di workspace
  const members = await db.membership.findMany({
    where: {
      workspaceId: activity.workspaceId,
      userId: { in: userIds },
    },
    select: { userId: true },
  });

  const allowed = new Set(members.map((m) => m.userId));

  const created: any[] = [];
  const skipped: any[] = [];

  for (const targetUserId of userIds) {
    if (!allowed.has(targetUserId)) {
      skipped.push({ userId: targetUserId, reason: "NOT_IN_WORKSPACE" });
      continue;
    }

    try {
      const a = await db.activityAssignment.create({
        data: {
          activityId,
          userId: targetUserId,
          roleNote: roleNote ?? null,
          assignedById: userId,
        },
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true } },
          roleNote: true,
          assignedAt: true,
        },
      });
      created.push(a);
    } catch (e) {
      skipped.push({ userId: targetUserId, reason: "ALREADY_ASSIGNED" });
    }
  }

  return NextResponse.json(
    {
      message: "Processed",
      createdCount: created.length,
      created,
      skipped,
    },
    { status: 201 }
  );
});
