-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ONLINE', 'AWAY', 'BUSY', 'OFFLINE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ONLINE';

-- CreateIndex
CREATE INDEX "direct_messages_senderId_receiverId_createdAt_idx" ON "direct_messages"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "direct_messages_receiverId_isRead_idx" ON "direct_messages"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "friendships_userId_status_idx" ON "friendships"("userId", "status");

-- CreateIndex
CREATE INDEX "friendships_friendId_status_idx" ON "friendships"("friendId", "status");
