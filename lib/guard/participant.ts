import { db } from "@/lib/prisma";

export const getWorkspaceIdByParticipantId = async (participantId: string) => {
  const p = await db.participant.findUnique({
    where: { id: participantId },
    select: { workspaceId: true },
  });
  if (!p)
    throw new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return p.workspaceId;
};
