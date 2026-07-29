-- AlterEnum
-- BR-25: tin nhắn hệ thống tổng kết cuộc gọi (nhỡ / bị từ chối / đã kết thúc)
ALTER TYPE "MessageType" ADD VALUE 'call';

-- CreateEnum
CREATE TYPE "CallKind" AS ENUM ('audio', 'video');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ringing', 'connected', 'ended', 'rejected', 'missed', 'failed', 'unavailable', 'busy');

-- CreateTable
CREATE TABLE "call_sessions" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "caller_id" INTEGER NOT NULL,
    "callee_id" INTEGER NOT NULL,
    "kind" "CallKind" NOT NULL DEFAULT 'audio',
    "status" "CallStatus" NOT NULL DEFAULT 'ringing',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "duration_sec" INTEGER NOT NULL DEFAULT 0,
    "end_reason" TEXT,

    CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_sessions_conversation_id_invited_at_idx" ON "call_sessions"("conversation_id", "invited_at");

-- CreateIndex
CREATE INDEX "call_sessions_caller_id_idx" ON "call_sessions"("caller_id");

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_callee_id_fkey" FOREIGN KEY ("callee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
