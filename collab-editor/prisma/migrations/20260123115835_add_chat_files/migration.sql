-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "chat_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_files_messageId_idx" ON "chat_files"("messageId");

-- CreateIndex
CREATE INDEX "chat_files_uploadedBy_idx" ON "chat_files"("uploadedBy");

-- AddForeignKey
ALTER TABLE "chat_files" ADD CONSTRAINT "chat_files_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
