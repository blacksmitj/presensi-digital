import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/guard/auth";
import { ActivityStatus, Role } from "@prisma/client";
import { ActivityCreateSchema } from "@/schema/activity";
import { requireStartBeforeEnd } from "@/lib/guard/time";
import { withApi } from "@/lib/withapi";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";

export const GET = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  await ensureWorkspaceAccess(userId, workspaceId);

  const items = await db.activity.findMany({
    where: { workspaceId },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
      startAt: true,
      endAt: true,
      status: true,
      _count: { select: { checkpoints: true, attendances: true } },
    },
  });

  return NextResponse.json({ items });
});

export const POST = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => ({}));
  const parsed = ActivityCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { workspaceId, name, location, startAt, endAt, rules } = parsed.data;

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  requireStartBeforeEnd(startAt, endAt);

  const created = await db.activity.create({
    data: {
      workspaceId,
      name,
      location: location ?? null,
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: startAt ? new Date(endAt) : new Date(),
      status: ActivityStatus.SCHEDULED,
      rules: rules ?? {
        graceIn: 10,
        minDuration: 30,
        requireOut: true,
        autoClose: true,
      },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json(created, { status: 201 });
});
