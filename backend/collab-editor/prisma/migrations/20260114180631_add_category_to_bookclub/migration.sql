-- AlterTable
ALTER TABLE "bookclubs" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General';

-- CreateIndex
CREATE INDEX "bookclubs_category_idx" ON "bookclubs"("category");
