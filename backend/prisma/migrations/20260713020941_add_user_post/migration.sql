-- AlterEnum
ALTER TYPE "ActivityPostType" ADD VALUE 'user_post';

-- AlterTable
ALTER TABLE "activity_posts" ADD COLUMN     "content" TEXT;
