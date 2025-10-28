import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { db } from "@/lib/prisma";
import { generateQrRef } from "@/lib/qr";
import { withApi } from "@/lib/withapi";
import { ParticipantCreateSchema } from "@/schema/participant";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";

export const GET = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const q = searchParams.get("q")?.trim();
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Math.min(100, Number(searchParams.get("pageSize") ?? "20"));

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  await ensureWorkspaceAccess(userId, workspaceId);

  const where = {
    workspaceId,
    ...(q && {
      OR: [
        { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { externalId: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ],
    }),
  };

  const [total, items] = await Promise.all([
    db.participant.count({ where }),
    db.participant.findMany({
      where,
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        externalId: true,
        name: true,
        email: true,
        phone: true,
        qrRef: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ items, pagination: { page, pageSize, total } });
});

export const POST = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const body = await req.json().catch(() => ({}));
  const parsed = ParticipantCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { workspaceId, externalId, name, email, phone } = parsed.data;

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const created = await db.participant.create({
    data: {
      workspaceId,
      externalId: externalId ?? null,
      name,
      email: email ?? null,
      phone: phone ?? null,
      qrRef: generateQrRef(),
    },
    select: { id: true, name: true, qrRef: true },
  });

  return NextResponse.json(created, { status: 201 });
});
