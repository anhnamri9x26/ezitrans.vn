ALTER TABLE "FormSubmission"
ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "readAt" TIMESTAMP(3);

-- Existing submissions predate the notification inbox and should not inflate the initial unread badge.
UPDATE "FormSubmission"
SET "isRead" = true, "readAt" = NOW();

CREATE INDEX "FormSubmission_isRead_createdAt_idx"
ON "FormSubmission"("isRead", "createdAt");

CREATE TABLE "AdminNotification" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "referenceId" TEXT,
    "metadata" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminNotification_isRead_createdAt_idx"
ON "AdminNotification"("isRead", "createdAt");

CREATE INDEX "AdminNotification_type_referenceId_idx"
ON "AdminNotification"("type", "referenceId");
