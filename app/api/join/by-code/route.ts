import { logAudit } from "@/lib/audit";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { JoinCodeSchema } from "@/schema/workspace";
import { AuditAction, Role, WorkspaceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await requireSession();

  const userId = session?.user?.id as string;
  const userEmail = session?.user?.email as string;

  const body = await req.json().catch(() => {});
  const parsed = JoinCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { code } = parsed.data;

  const workspace = await db.workspace.findUnique({
    where: {
      joinCode: code,
    },
    select: {
      id: true,
      name: true,
      status: true,
      defaultRole: true,
    },
  });

  if (!workspace || workspace.status !== WorkspaceStatus.ACTIVE) {
    return NextResponse.json(
      { error: "Kode tidak valid atau tidak aktif" },
      { status: 400 }
    );
  }

  const existing = await db.membership.findFirst({
    where: {
      userId,
      workspaceId: workspace.id,
    },
    select: {
      role: true,
    },
  });

  if (existing) {
    return NextResponse.json({
      message: "Sudah menjadi member",
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      myRole: existing.role,
    });
  }

  const membership = await db.membership.create({
    data: {
      userId,
      workspaceId: workspace.id,
      role: workspace.defaultRole as Role,
    },
    select: {
      id: true,
      role: true,
    },
  });

  // Audit log here
  await logAudit({
    workspaceId: workspace.id,
    userId,
    action: AuditAction.JOIN_WORKSPACE,
    message: `${userEmail} bergabung ke workspace ${workspace.name} sebagai ${membership.role}`,
    req,
    target: { type: "Membership", id: membership.id },
    metadata: { role: membership.role, email: userEmail },
  });

  return NextResponse.json({
    message: "Berhasil bergabung",
    workspace: {
      id: workspace.id,
      name: workspace.name,
    },
    myRole: membership.role,
  });
}
