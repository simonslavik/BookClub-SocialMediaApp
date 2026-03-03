-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "coverUrl" TEXT,
    "description" TEXT,
    "pageCount" INTEGER,
    "isbn" TEXT,
    "googleBooksId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookClubBook" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookClubBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rating" INTEGER,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "bookClubBookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "lastReadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_googleBooksId_key" ON "Book"("googleBooksId");

-- CreateIndex
CREATE INDEX "BookClubBook_bookClubId_idx" ON "BookClubBook"("bookClubId");

-- CreateIndex
CREATE INDEX "BookClubBook_status_idx" ON "BookClubBook"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BookClubBook_bookClubId_bookId_key" ON "BookClubBook"("bookClubId", "bookId");

-- CreateIndex
CREATE INDEX "UserBook_userId_idx" ON "UserBook"("userId");

-- CreateIndex
CREATE INDEX "UserBook_status_idx" ON "UserBook"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserBook_userId_bookId_key" ON "UserBook"("userId", "bookId");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_idx" ON "ReadingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_bookClubBookId_userId_key" ON "ReadingProgress"("bookClubBookId", "userId");

-- AddForeignKey
ALTER TABLE "BookClubBook" ADD CONSTRAINT "BookClubBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_bookClubBookId_fkey" FOREIGN KEY ("bookClubBookId") REFERENCES "BookClubBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
