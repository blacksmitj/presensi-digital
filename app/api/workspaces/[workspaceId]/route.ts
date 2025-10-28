import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { withApi } from "@/lib/withapi";
import { WorkspaceUpdateSchema } from "@/schema/workspace";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export const GET = withApi(async (_req, ctx) => {
  const session = await requireSession();
  const userId = session?.user?.id as string;
  const { workspaceId } = (await ctx?.params) ?? {};

  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspace id" },
      { status: 400 }
    );
  }

  await ensureWorkspaceAccess(userId, workspaceId);

  const workspace = await prisma?.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    include: {
      _count: {
        select: {
          activities: true,
          participants: true,
          memberships: true,
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
});

export const PATCH = withApi(async (req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { id } = (await ctx?.params) ?? {};

  if (!id) {
    return NextResponse.json(
      { error: "Missing workspace id" },
      { status: 400 }
    );
  }

  await ensureWorkspaceAccess(userId, id, [Role.OWNER, Role.ADMIN]);

  const body = await req.json().catch(() => {});
  const parsed = WorkspaceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { name, startDate, endDate, defaultRole } = parsed.data;

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return NextResponse.json(
      { error: "Start date must be before end date" },
      { status: 400 }
    );
  }
  const update = await prisma?.workspace.update({
    where: {
      id,
    },
    data: {
      name: name ?? undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      defaultRole: defaultRole ?? undefined,
    },
  });

  return NextResponse.json(update);
});
