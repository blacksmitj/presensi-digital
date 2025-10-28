import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/guard/auth";
import { ActivityUpdateSchema } from "@/schema/activity";
import { withApi } from "@/lib/withapi";
import { requireStartBeforeEnd } from "@/lib/guard/time";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { getWorkspaceIdbyActivityId } from "@/lib/guard/activity";

export const GET = withApi(async (_req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { activityId } = (await ctx?.params) ?? {};

  if (!activityId) {
    throw new Response(JSON.stringify({ error: "Missing activity id" }), {
      status: 400,
    });
  }

  const workspaceId = await getWorkspaceIdbyActivityId(activityId);

  await ensureWorkspaceAccess(userId, workspaceId);

  const act = await db.activity.findUnique({
    where: { id: activityId },
    include: {
      _count: { select: { checkpoints: true, attendances: true } },
    },
  });

  if (!act) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(act);
});

export const PATCH = withApi(async (req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { activityId } = (await ctx?.params) ?? {};
  if (!activityId) {
    throw new Response(JSON.stringify({ error: "Missing activity id" }), {
      status: 400,
    });
  }

  const workspaceId = await getWorkspaceIdbyActivityId(activityId);

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const body = await req.json().catch(() => ({}));
  const parsed = ActivityUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  requireStartBeforeEnd(parsed.data.startAt, parsed.data.endAt);

  const updated = await db.activity.update({
    where: { id: activityId },
    data: parsed.data,
  });
  return NextResponse.json(updated);
});

export const DELETE = withApi(async (req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { activityId } = (await ctx?.params) ?? {};

  if (!activityId) {
    return NextResponse.json({ error: "Missing activity id" }, { status: 400 });
  }

  const workspaceId = await getWorkspaceIdbyActivityId(activityId);

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const counts = await db.attendance.count({
    where: { activityId: activityId },
  });
  if (counts > 0) {
    return NextResponse.json(
      { error: "Cannot delete: attendance already exists" },
      { status: 409 }
    );
  }

  await db.activity.delete({ where: { id: activityId } });

  return NextResponse.json({ success: true });
});
