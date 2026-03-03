-- CreateTable
CREATE TABLE "bookclub_events" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'meeting',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookclub_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookclub_events_bookClubId_eventDate_idx" ON "bookclub_events"("bookClubId", "eventDate");

-- AddForeignKey
ALTER TABLE "bookclub_events" ADD CONSTRAINT "bookclub_events_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "bookclubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
