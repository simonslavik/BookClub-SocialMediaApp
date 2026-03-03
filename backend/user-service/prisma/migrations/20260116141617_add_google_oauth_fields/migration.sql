/*
  Warnings:

  - A unique constraint covering the columns `[userId,friendId]` on the table `friendships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId_friendId_key" ON "friendships"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
