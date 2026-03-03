-- CreateTable
CREATE TABLE "BookClubBookRating" (
    "id" TEXT NOT NULL,
    "bookClubBookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookClubBookRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookClubBookRating_bookClubBookId_idx" ON "BookClubBookRating"("bookClubBookId");

-- CreateIndex
CREATE INDEX "BookClubBookRating_userId_idx" ON "BookClubBookRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookClubBookRating_bookClubBookId_userId_key" ON "BookClubBookRating"("bookClubBookId", "userId");

-- CreateIndex
CREATE INDEX "BookClubBook_bookClubId_status_idx" ON "BookClubBook"("bookClubId", "status");

-- CreateIndex
CREATE INDEX "BookSuggestion_bookClubId_status_idx" ON "BookSuggestion"("bookClubId", "status");

-- CreateIndex
CREATE INDEX "BookSuggestion_suggestedById_idx" ON "BookSuggestion"("suggestedById");

-- CreateIndex
CREATE INDEX "UserBook_userId_status_idx" ON "UserBook"("userId", "status");

-- AddForeignKey
ALTER TABLE "BookClubBookRating" ADD CONSTRAINT "BookClubBookRating_bookClubBookId_fkey" FOREIGN KEY ("bookClubBookId") REFERENCES "BookClubBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
