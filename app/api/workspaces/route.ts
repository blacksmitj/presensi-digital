import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/guard/auth";
import { generateJoinCode } from "@/lib/joincode";
import { WorkspaceCreateSchema } from "@/schema/workspace";
import { Role, WorkspaceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireStartBeforeEnd } from "@/lib/guard/time";
import { withApi } from "@/lib/withapi";

export const GET = withApi(async (_req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const membership = await db.membership.findMany({
    where: {
      userId,
    },
    select: {
      workspace: true,
      role: true,
    },
    orderBy: {
      workspace: {
        name: "desc",
      },
    },
  });
  return NextResponse.json({
    items: membership?.map((m) => ({ ...m.workspace, myRole: m.role })),
  });
});

export const POST = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => {});
  const parsed = WorkspaceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { name, startDate, endDate, defaultRole } = parsed.data;

  requireStartBeforeEnd(startDate, endDate);

  const joinCode = generateJoinCode(name);

  const workspace = await db.workspace.create({
    data: {
      name,
      status: WorkspaceStatus.ACTIVE,
      joinCode,
      defaultRole: defaultRole ?? Role.STAFF,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdById: userId,
      memberships: {
        create: { userId, role: Role.OWNER },
      },
    },
  });

  return NextResponse.json(workspace, { status: 201 });
});
