-- CreateTable
CREATE TABLE "section_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_activities" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityBy" TEXT NOT NULL,

    CONSTRAINT "section_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "section_reads_userId_clubId_idx" ON "section_reads"("userId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "section_reads_userId_clubId_section_key" ON "section_reads"("userId", "clubId", "section");

-- CreateIndex
CREATE INDEX "section_activities_clubId_idx" ON "section_activities"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "section_activities_clubId_section_key" ON "section_activities"("clubId", "section");
