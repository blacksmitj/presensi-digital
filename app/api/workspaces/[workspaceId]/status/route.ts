import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { withApi } from "@/lib/withapi";
import { WorkspaceStatusSchema } from "@/schema/workspace";
import { Role, WorkspaceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export const POST = withApi(async (req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { workspaceId } = (await ctx?.params) ?? {};

  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspace id" },
      { status: 400 }
    );
  }

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const body = await req.json().catch(() => {});
  const parsed = WorkspaceStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const update = await prisma?.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      status: parsed.data.status as WorkspaceStatus,
    },
    select: {
      id: true,
      name: true,
      status: true,
      joinCode: true,
    },
  });

  return NextResponse.json(update);
});
