-- CreateTable
CREATE TABLE "BookClubBookReview" (
    "id" TEXT NOT NULL,
    "bookClubBookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookClubBookReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookClubBookReview_bookClubBookId_idx" ON "BookClubBookReview"("bookClubBookId");

-- CreateIndex
CREATE INDEX "BookClubBookReview_userId_idx" ON "BookClubBookReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookClubBookReview_bookClubBookId_userId_key" ON "BookClubBookReview"("bookClubBookId", "userId");

-- AddForeignKey
ALTER TABLE "BookClubBookReview" ADD CONSTRAINT "BookClubBookReview_bookClubBookId_fkey" FOREIGN KEY ("bookClubBookId") REFERENCES "BookClubBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
