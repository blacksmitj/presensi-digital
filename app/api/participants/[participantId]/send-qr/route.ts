// src/app/api/participants/[id]/send-qr/route.ts
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/guard/auth";
import { db } from "@/lib/prisma";
import { ensureWorkspaceAccess } from "@/lib/guard/membership";
import { sendParticipantQrEmail } from "@/lib/sendqr/send-participant-qr";
import { withApi } from "@/lib/withapi";

export const POST = withApi(async (_res, ctx) => {
  const session = await requireSession();
  const userId = session.user?.id as string;
  const { participantId } = ctx?.params ?? {};

  // ambil participant + workspace
  const participant = await db.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      name: true,
      email: true,
      qrRef: true,
      workspace: { select: { id: true, name: true } },
    },
  });
  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found" },
      { status: 404 }
    );
  }

  // hanya OWNER/ADMIN yang boleh kirim ulang
  await ensureWorkspaceAccess(userId, participant.workspace.id, [
    Role.OWNER,
    Role.ADMIN,
  ]);

  if (!participant.email) {
    return NextResponse.json(
      { error: "Participant has no email" },
      { status: 400 }
    );
  }

  await sendParticipantQrEmail({
    toEmail: participant.email,
    participantName: participant.name,
    qrRef: participant.qrRef,
    workspaceName: participant.workspace.name,
  });

  return NextResponse.json({ success: true });
});
