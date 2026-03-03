-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('ATTENDING', 'MAYBE', 'NOT_ATTENDING');

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meetingUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'custom',
    "hostId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_rsvps" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'ATTENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meetings_bookClubId_idx" ON "meetings"("bookClubId");

-- CreateIndex
CREATE INDEX "meetings_bookClubId_scheduledAt_idx" ON "meetings"("bookClubId", "scheduledAt");

-- CreateIndex
CREATE INDEX "meetings_hostId_idx" ON "meetings"("hostId");

-- CreateIndex
CREATE INDEX "meeting_rsvps_meetingId_idx" ON "meeting_rsvps"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_rsvps_meetingId_userId_key" ON "meeting_rsvps"("meetingId", "userId");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_rsvps" ADD CONSTRAINT "meeting_rsvps_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
