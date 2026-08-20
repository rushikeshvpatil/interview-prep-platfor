-- AlterTable
ALTER TABLE "InterviewSession" ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN "customTitle" TEXT,
ADD COLUMN "customDescription" TEXT,
ADD COLUMN "customConstraints" TEXT;

-- CreateTable
CREATE TABLE "InterviewTestCase" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewTestCase_sessionId_idx" ON "InterviewTestCase"("sessionId");

-- AddForeignKey
ALTER TABLE "InterviewTestCase" ADD CONSTRAINT "InterviewTestCase_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
