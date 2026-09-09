-- CreateTable
CREATE TABLE "AssessmentDraft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "reminderSentAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentDraft_status_startedAt_idx" ON "AssessmentDraft"("status", "startedAt");

-- CreateIndex
CREATE INDEX "AssessmentDraft_email_status_idx" ON "AssessmentDraft"("email", "status");
