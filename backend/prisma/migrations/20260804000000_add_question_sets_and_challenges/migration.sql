-- CreateEnum
CREATE TYPE "SetStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('vocabulary', 'grammar', 'cloze', 'reading');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('active', 'retired');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('manual', 'ai_generated');

-- CreateTable
CREATE TABLE "vocab_topics" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vocab_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_sets" (
    "id" SERIAL NOT NULL,
    "language_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "framework" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "level_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content_language" TEXT NOT NULL DEFAULT 'vi',
    "status" "SetStatus" NOT NULL DEFAULT 'draft',
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" INTEGER NOT NULL,
    "updated_by_id" INTEGER,
    "published_at" TIMESTAMP(3),
    "last_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" SERIAL NOT NULL,
    "set_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "term" TEXT,
    "passage" TEXT,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "answer_index" INTEGER NOT NULL,
    "explanation" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'active',
    "source" "QuestionSource" NOT NULL DEFAULT 'manual',
    "source_meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "set_id" INTEGER NOT NULL,
    "challenge_id" INTEGER,
    "total_count" INTEGER NOT NULL DEFAULT 20,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "question_order" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "option_order" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_answers" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "chosen_index" INTEGER,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_challenges" (
    "id" SERIAL NOT NULL,
    "set_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vocab_topics_name_key" ON "vocab_topics"("name");

-- CreateIndex
CREATE INDEX "question_sets_status_language_id_level_order_idx" ON "question_sets"("status", "language_id", "level_order");

-- CreateIndex
CREATE UNIQUE INDEX "question_sets_language_id_topic_id_level_key" ON "question_sets"("language_id", "topic_id", "level");

-- CreateIndex
CREATE INDEX "test_questions_set_id_status_idx" ON "test_questions"("set_id", "status");

-- CreateIndex
CREATE INDEX "test_attempts_user_id_started_at_idx" ON "test_attempts"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "test_attempts_user_id_set_id_idx" ON "test_attempts"("user_id", "set_id");

-- CreateIndex
CREATE INDEX "test_attempts_challenge_id_correct_count_idx" ON "test_attempts"("challenge_id", "correct_count");

-- CreateIndex
CREATE UNIQUE INDEX "test_attempts_user_id_challenge_id_key" ON "test_attempts"("user_id", "challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_answers_attempt_id_question_id_key" ON "test_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "community_challenges_starts_at_ends_at_idx" ON "community_challenges"("starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "vocab_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "question_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "community_challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_challenges" ADD CONSTRAINT "community_challenges_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "question_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

