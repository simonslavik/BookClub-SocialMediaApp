/*
  Warnings:

  - A unique constraint covering the columns `[bookClubId,name]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('PUBLIC', 'PRIVATE', 'ANNOUNCEMENT');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "RoomType" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "room_members" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_members_roomId_idx" ON "room_members"("roomId");

-- CreateIndex
CREATE INDEX "room_members_userId_idx" ON "room_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "room_members_roomId_userId_key" ON "room_members"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_bookClubId_name_key" ON "rooms"("bookClubId", "name");

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
