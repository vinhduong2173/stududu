-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'schedule');

-- CreateEnum
CREATE TYPE "VocabLabel" AS ENUM ('new', 'good');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "payload" JSONB,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "available_slots" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timezone" TEXT DEFAULT 'VN';

-- CreateTable
CREATE TABLE "vocab_words" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "flag" TEXT,
    "label" "VocabLabel" NOT NULL DEFAULT 'new',
    "note" TEXT,
    "from_partner" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocab_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocab_words_user_id_created_at_idx" ON "vocab_words"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
