/*
  Warnings:

  - You are about to drop the column `bookClubId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `roomId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_bookClubId_fkey";

-- DropIndex
DROP INDEX "messages_bookClubId_createdAt_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "bookClubId",
ADD COLUMN     "roomId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rooms_bookClubId_idx" ON "rooms"("bookClubId");

-- CreateIndex
CREATE INDEX "messages_roomId_createdAt_idx" ON "messages"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
