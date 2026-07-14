-- CreateEnum
CREATE TYPE "SavedWordSource" AS ENUM ('chat', 'manual');

-- CreateEnum
CREATE TYPE "EndorsementLabel" AS ENUM ('lang_proficiency', 'social_knowledge', 'niche_expertise', 'friendliness');

-- CreateEnum
CREATE TYPE "ActivityPostType" AS ENUM ('word_public', 'chat_hours_milestone');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "reactions" JSONB;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "target_id" INTEGER,
ADD COLUMN     "target_type" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "share_activity" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "word_library" (
    "id" SERIAL NOT NULL,
    "term" VARCHAR(100) NOT NULL,
    "language_id" INTEGER NOT NULL,
    "definition" TEXT,
    "example" TEXT,
    "save_count" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_words" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "word_library_id" INTEGER NOT NULL,
    "personal_note" TEXT,
    "source" "SavedWordSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" SERIAL NOT NULL,
    "giver_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "label" "EndorsementLabel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "ActivityPostType" NOT NULL,
    "content_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_requests" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "proposer_id" INTEGER NOT NULL,
    "proposed_time_utc" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'pending',
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "word_library_term_language_id_key" ON "word_library"("term", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_saved_words_user_id_word_library_id_key" ON "user_saved_words"("user_id", "word_library_id");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_giver_id_receiver_id_label_key" ON "endorsements"("giver_id", "receiver_id", "label");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "word_library" ADD CONSTRAINT "word_library_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_words" ADD CONSTRAINT "user_saved_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_words" ADD CONSTRAINT "user_saved_words_word_library_id_fkey" FOREIGN KEY ("word_library_id") REFERENCES "word_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_giver_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_posts" ADD CONSTRAINT "activity_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "activity_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
