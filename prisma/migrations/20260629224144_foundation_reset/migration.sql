-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "attempt" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "codingScore" INTEGER,
ADD COLUMN     "logicalScore" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "bestAiProject" TEXT,
ADD COLUMN     "researchWork" TEXT;
