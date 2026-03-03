-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "meetingCreated" BOOLEAN NOT NULL DEFAULT true,
    "meetingUpdated" BOOLEAN NOT NULL DEFAULT true,
    "meetingCancelled" BOOLEAN NOT NULL DEFAULT true,
    "meetingReminder24h" BOOLEAN NOT NULL DEFAULT true,
    "meetingReminder1h" BOOLEAN NOT NULL DEFAULT true,
    "meetingStarting" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "EmailLog_userId_createdAt_idx" ON "EmailLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_notificationId_idx" ON "EmailLog"("notificationId");

-- CreateIndex
CREATE INDEX "EmailLog_meetingId_type_idx" ON "EmailLog"("meetingId", "type");
