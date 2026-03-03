-- CreateTable
CREATE TABLE "bookclub_invites" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookclub_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookclub_invites_code_key" ON "bookclub_invites"("code");

-- CreateIndex
CREATE INDEX "bookclub_invites_bookClubId_idx" ON "bookclub_invites"("bookClubId");

-- CreateIndex
CREATE INDEX "bookclub_invites_code_idx" ON "bookclub_invites"("code");
