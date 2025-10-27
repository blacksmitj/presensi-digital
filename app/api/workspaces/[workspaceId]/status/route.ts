import { requireSession } from "@/lib/auth";
import { ensureWorkspaceAccess } from "@/lib/authz";
import { WorkspaceStatusSchema } from "@/schema/workspace";
import { Role, WorkspaceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { id } = params;

  const role = await ensureWorkspaceAccess(userId, id, [
    Role.OWNER,
    Role.ADMIN,
  ]);

  const body = await req.json().catch(() => {});
  const parsed = WorkspaceStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const update = await prisma?.workspace.update({
    where: {
      id,
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
}
