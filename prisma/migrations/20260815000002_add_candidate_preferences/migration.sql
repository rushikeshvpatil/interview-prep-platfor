-- AlterTable
ALTER TABLE "User" ADD COLUMN "bio" TEXT,
ADD COLUMN "experienceLevel" TEXT,
ADD COLUMN "targetRole" TEXT,
ADD COLUMN "targetCompanies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "primaryFocus" TEXT,
ADD COLUMN "targetInterviewDate" TIMESTAMP(3),
ADD COLUMN "preferredDifficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM';
