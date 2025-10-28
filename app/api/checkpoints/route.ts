import { getWorkspaceIdByActivityId } from "@/lib/guard/activity";
import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { db } from "@/lib/prisma";
import { toCode } from "@/lib/slug";
import { withApi } from "@/lib/withapi";
import { CheckpointCreateSchema } from "@/schema/checkpoint";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

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

  await ensureWorkspaceAccess(userId, workspaceId); // semua member boleh lihat

  const items = await db.checkpoint.findMany({
    where: { activityId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items });
});

export const POST = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => ({}));
  const parsed = CheckpointCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { activityId, name } = parsed.data;

  const workspaceId = await getWorkspaceIdByActivityId(activityId);

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  // generate code unik per activity
  const base = toCode(name);
  const existing = await db.checkpoint.findMany({
    where: { activityId, code: { startsWith: base } },
    select: { code: true },
  });
  const counter = existing.filter(
    (c) => c.code === base || c.code.startsWith(base + "-")
  ).length;
  const code = counter ? `${base}-${counter + 1}` : base;

  const created = await db.checkpoint.create({
    data: { activityId, name, code },
  });

  return NextResponse.json(created, { status: 201 });
});
