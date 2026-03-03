/*
  Warnings:

  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "snapshots" DROP CONSTRAINT "snapshots_roomId_fkey";

-- DropTable
DROP TABLE "rooms";

-- DropTable
DROP TABLE "snapshots";

-- CreateTable
CREATE TABLE "bookclubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled Book Club',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "members" TEXT[],
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookclubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookclubs_creatorId_idx" ON "bookclubs"("creatorId");

-- CreateIndex
CREATE INDEX "bookclubs_lastActiveAt_idx" ON "bookclubs"("lastActiveAt");

-- CreateIndex
CREATE INDEX "bookclubs_isPublic_idx" ON "bookclubs"("isPublic");

-- CreateIndex
CREATE INDEX "messages_bookClubId_createdAt_idx" ON "messages"("bookClubId", "createdAt");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
