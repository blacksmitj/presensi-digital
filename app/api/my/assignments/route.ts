import { requireSession } from "@/lib/guard/auth";
import { db } from "@/lib/prisma";
import { withApi } from "@/lib/withapi";
import { NextResponse } from "next/server";

export const GET = withApi(async (req) => {
  const session = await requireSession();
  const userId = session.user?.id as string;

  const items = await db.activityAssignment.findMany({
    where: { userId },
    orderBy: { assignedAt: "desc" },
    select: {
      id: true,
      roleNote: true,
      activity: {
        select: {
          id: true,
          name: true,
          startAt: true,
          endAt: true,
          workspace: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ items });
});
