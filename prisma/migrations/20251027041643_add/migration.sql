-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE_WORKSPACE', 'UPDATE_WORKSPACE', 'DELETE_WORKSPACE', 'JOIN_WORKSPACE', 'LEAVE_WORKSPACE', 'ADD_MEMBER', 'REMOVE_MEMBER', 'UPDATE_MEMBER_ROLE', 'CREATE_ACTIVITY', 'UPDATE_ACTIVITY', 'DELETE_ACTIVITY', 'CREATE_CHECKPOINT', 'UPDATE_CHECKPOINT', 'DELETE_CHECKPOINT', 'SCAN_IN', 'SCAN_OUT', 'LOGIN', 'LOGOUT', 'INVITE_SENT', 'INVITE_ACCEPTED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "message" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "route" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
