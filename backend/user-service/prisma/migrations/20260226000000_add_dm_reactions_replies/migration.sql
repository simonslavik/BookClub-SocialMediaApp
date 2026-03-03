-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "direct_messages" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "direct_messages" ADD COLUMN "replyToId" TEXT;

-- CreateTable
CREATE TABLE "dm_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dm_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dm_reactions_messageId_idx" ON "dm_reactions"("messageId");
CREATE INDEX "dm_reactions_userId_idx" ON "dm_reactions"("userId");
CREATE UNIQUE INDEX "dm_reactions_messageId_userId_emoji_key" ON "dm_reactions"("messageId", "userId", "emoji");

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "direct_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dm_reactions" ADD CONSTRAINT "dm_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
