-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN "stream" TEXT NOT NULL DEFAULT 'DSA',
ADD COLUMN "interviewerNotes" TEXT;

-- AlterTable
ALTER TABLE "SessionFeedback" ADD COLUMN "recommendation" TEXT;
