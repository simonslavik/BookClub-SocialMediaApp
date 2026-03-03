-- CreateTable
CREATE TABLE "room_reads" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_reads_userId_idx" ON "room_reads"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "room_reads_roomId_userId_key" ON "room_reads"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "room_reads" ADD CONSTRAINT "room_reads_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
