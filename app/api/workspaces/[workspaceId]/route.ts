import { requireSession } from "@/lib/auth";
import { ensureWorkspaceAccess } from "@/lib/authz";
import { WorkspaceUpdateSchema } from "@/schema/workspace";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  const userId = session?.user?.id as string;
  const { id } = params;

  await ensureWorkspaceAccess(userId, id);

  const workspace = await prisma?.workspace.findUnique({
    where: {
      id,
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
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { id } = params;

  const role = await ensureWorkspaceAccess(userId, id);
  const allowedRoles: Role[] = [Role.OWNER, Role.ADMIN];

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Only owner or admin can update workspace" },
      { status: 403 }
    );
  }

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
}
