-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;
