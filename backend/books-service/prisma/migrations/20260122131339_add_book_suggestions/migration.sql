-- CreateTable
CREATE TABLE "BookSuggestion" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "suggestedById" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookSuggestionVote" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookSuggestionVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookSuggestion_bookClubId_idx" ON "BookSuggestion"("bookClubId");

-- CreateIndex
CREATE INDEX "BookSuggestion_status_idx" ON "BookSuggestion"("status");

-- CreateIndex
CREATE INDEX "BookSuggestionVote_suggestionId_idx" ON "BookSuggestionVote"("suggestionId");

-- CreateIndex
CREATE INDEX "BookSuggestionVote_userId_idx" ON "BookSuggestionVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookSuggestionVote_suggestionId_userId_key" ON "BookSuggestionVote"("suggestionId", "userId");

-- AddForeignKey
ALTER TABLE "BookSuggestion" ADD CONSTRAINT "BookSuggestion_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookSuggestionVote" ADD CONSTRAINT "BookSuggestionVote_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "BookSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
