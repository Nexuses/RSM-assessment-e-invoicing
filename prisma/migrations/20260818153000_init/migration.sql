-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "totalScore" INTEGER NOT NULL,
    "urgencyScore" INTEGER NOT NULL,
    "urgencyCategory" TEXT NOT NULL,
    "complexityScore" INTEGER NOT NULL,
    "complexityCategory" TEXT NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "pdfS3Url" TEXT,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "score" INTEGER,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

