import { db } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateJoinCode } from "@/lib/joincode";
import { WorkspaceCreateSchema } from "@/schema/workspace";
import { Role, WorkspaceStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
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
}

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => {});
  const parsed = WorkspaceCreateSchema.safeParse(body);
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

  const joinCode = generateJoinCode(name);

  const workspace = await db.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        name,
        status: WorkspaceStatus.ACTIVE,
        joinCode,
        defaultRole: defaultRole ?? Role.STAFF,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: userId,
      },
    });

    await tx.membership.create({
      data: {
        workspaceId: created.id,
        userId,
        role: Role.OWNER,
      },
    });

    return created;
  });

  return NextResponse.json(workspace, { status: 201 });
}
