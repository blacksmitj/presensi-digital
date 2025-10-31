import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/guard/auth";
import { db } from "@/lib/prisma";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { withApi } from "@/lib/withapi";

export const DELETE = withApi(async (res, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { assignmentId } = ctx?.params ?? {};

  // ambil assignment + activity → workspace
  const assignment = await db.activityAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      activityId: true,
      activity: { select: { workspaceId: true } },
    },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // hanya OWNER/ADMIN yang boleh unassign
  await ensureWorkspaceAccess(userId, assignment.activity.workspaceId, [
    Role.OWNER,
    Role.ADMIN,
  ]);

  // opsional: cek dulu apakah sudah ada scan yang pakai assignment ini
  const used = await db.attendance.count({
    where: { staffAssignmentId: assignmentId },
  });
  if (used > 0) {
    // Bisa pilih:
    // 1) tolak delete
    // 2) atau soft-delete (tambah field deletedAt di ActivityAssignment)
    return NextResponse.json(
      { error: "Cannot delete: used in attendance" },
      { status: 409 }
    );
  }

  await db.activityAssignment.delete({ where: { id: assignmentId } });

  return NextResponse.json({ success: true });
});
