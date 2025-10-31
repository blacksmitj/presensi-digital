import { Role } from "@prisma/client";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function ensureWorkspaceAccess(
  userId: string,
  workspaceId: string,
  allowed: Role[] | null = null
): Promise<Role> {
  const membership = await db.membership.findFirst({
    where: {
      userId,
      workspaceId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw NextResponse.json(
      { error: "Forbidden access to this workspace" },
      { status: 403 }
    );
  }

  if (allowed && !allowed.includes(membership.role)) {
    throw NextResponse.json(
      { error: "Only " + allowed.join(" or ") + " can access this workspace" },
      { status: 403 }
    );
  }

  return membership.role;
}
