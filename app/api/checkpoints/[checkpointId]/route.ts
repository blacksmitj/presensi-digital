import { getWorkspaceIdByActivityId } from "@/lib/guard/activity";
import { requireSession } from "@/lib/guard/auth";
import { getActivityIdByCheckpointId } from "@/lib/guard/checkpoint";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { db } from "@/lib/prisma";
import { withApi } from "@/lib/withapi";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export const DELETE = withApi(async (_req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { checkpointId } = (await ctx?.params) ?? {};
  if (!checkpointId) {
    throw new Response(JSON.stringify({ error: "Missing activity id" }), {
      status: 400,
    });
  }

  const activityId = await getActivityIdByCheckpointId(checkpointId);

  const workspaceId = await getWorkspaceIdByActivityId(activityId);

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const used = await db.attendance.count({ where: { checkpointId } });
  if (used > 0) {
    return NextResponse.json(
      { error: "Cannot delete: checkpoint already used in attendance" },
      { status: 409 }
    );
  }

  await db.checkpoint.delete({ where: { id: checkpointId } });
  return NextResponse.json({ success: true });
});
