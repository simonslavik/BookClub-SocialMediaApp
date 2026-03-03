-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "messages_roomId_isPinned_idx" ON "messages"("roomId", "isPinned");
