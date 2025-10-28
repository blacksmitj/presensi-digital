import { requireSession } from "@/lib/guard/auth";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { getWorkspaceIdByParticipantId } from "@/lib/guard/participant";
import { db } from "@/lib/prisma";
import { withApi } from "@/lib/withapi";
import { ParticipantUpdateSchema } from "@/schema/participant";
import { Role } from "@prisma/client";
import { get } from "http";
import { NextResponse } from "next/server";

export const GET = withApi(async (_req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { participantId } = (await ctx?.params) ?? {};
  if (!participantId) {
    return NextResponse.json(
      { error: "Missing participant id" },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceIdByParticipantId(participantId);
  await ensureWorkspaceAccess(userId, workspaceId); // semua member boleh lihat

  const item = await db.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      externalId: true,
      name: true,
      email: true,
      phone: true,
      qrRef: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
});

export const PATCH = withApi(async (req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { participantId } = (await ctx?.params) ?? {};
  if (!participantId) {
    return NextResponse.json(
      { error: "Missing participant id" },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceIdByParticipantId(participantId);
  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const body = await req.json().catch(() => ({}));
  const parsed = ParticipantUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const updated = await db.participant.update({
    where: { id: participantId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      externalId: true,
      email: true,
      phone: true,
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withApi(async (_req, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const { participantId } = (await ctx?.params) ?? {};
  if (!participantId) {
    return NextResponse.json(
      { error: "Missing participant id" },
      { status: 400 }
    );
  }

  const workspaceId = await getWorkspaceIdByParticipantId(participantId);

  await ensureWorkspaceAccess(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

  const used = await db.attendance.count({
    where: { participantId },
  });
  if (used > 0) {
    return NextResponse.json(
      { error: "Cannot delete: participant already has attendance" },
      { status: 409 }
    );
  }

  await db.participant.delete({ where: { id: participantId } });
  return NextResponse.json({ success: true });
});
