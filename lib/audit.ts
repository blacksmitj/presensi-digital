// lib/audit.ts
import { db } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

type LogInput = {
  workspaceId: string;
  userId?: string | null;
  action: AuditAction;
  message: string;
  req?: Request; // kalau route handler Next.js
  target?: { type?: string; id?: string | null };
  metadata?: Record<string, any>;
  statusCode?: number;
};

export async function logAudit(input: LogInput) {
  const ua = input.req?.headers.get("user-agent") ?? undefined;
  const ip =
    input.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    // @ts-ignore Next.js runtime
    // (input.req as any)?.ip ||
    undefined;

  return db.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId ?? null,
      action: input.action,
      message: input.message,
      userAgent: ua,
      ipAddress: ip,
      route: input.req ? new URL(input.req.url).pathname : undefined,
      method: input.req ? (input.req as any).method ?? undefined : undefined,
      statusCode: input.statusCode,
      targetType: input.target?.type,
      targetId: input.target?.id ?? undefined,
      metadata: input.metadata as any,
    },
  });
}
