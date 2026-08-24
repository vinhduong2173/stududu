--
-- PostgreSQL database dump
--

-- \restrict lXur0id3PQaS9Gp8hkyfSMHrDpjkQ119hEA7Obv5eoD9a10ryBytNmI3tdiXp0m

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

ALTER TABLE IF EXISTS ONLY public.word_library DROP CONSTRAINT IF EXISTS word_library_language_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vocab_words DROP CONSTRAINT IF EXISTS vocab_words_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_saved_words DROP CONSTRAINT IF EXISTS user_saved_words_word_library_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_saved_words DROP CONSTRAINT IF EXISTS user_saved_words_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_languages DROP CONSTRAINT IF EXISTS user_languages_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_languages DROP CONSTRAINT IF EXISTS user_languages_language_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_interests DROP CONSTRAINT IF EXISTS user_interests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_interests DROP CONSTRAINT IF EXISTS user_interests_topic_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.schedule_requests DROP CONSTRAINT IF EXISTS schedule_requests_proposer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.schedule_requests DROP CONSTRAINT IF EXISTS schedule_requests_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_reported_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quizzes DROP CONSTRAINT IF EXISTS quizzes_creator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_submissions DROP CONSTRAINT IF EXISTS quiz_submissions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_submissions DROP CONSTRAINT IF EXISTS quiz_submissions_quiz_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_parent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_target_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_member_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_candidate_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_scores DROP CONSTRAINT IF EXISTS match_scores_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_preferences DROP CONSTRAINT IF EXISTS match_preferences_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.interactions DROP CONSTRAINT IF EXISTS interactions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.interactions DROP CONSTRAINT IF EXISTS interactions_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.endorsements DROP CONSTRAINT IF EXISTS endorsements_receiver_id_fkey;
ALTER TABLE IF EXISTS ONLY public.endorsements DROP CONSTRAINT IF EXISTS endorsements_giver_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comment_likes DROP CONSTRAINT IF EXISTS comment_likes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.comment_likes DROP CONSTRAINT IF EXISTS comment_likes_comment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_caller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_callee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.blocks DROP CONSTRAINT IF EXISTS blocks_blocker_id_fkey;
ALTER TABLE IF EXISTS ONLY public.blocks DROP CONSTRAINT IF EXISTS blocks_blocked_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activity_posts DROP CONSTRAINT IF EXISTS activity_posts_user_id_fkey;
DROP INDEX IF EXISTS public.word_library_term_language_id_key;
DROP INDEX IF EXISTS public.vocab_words_user_id_created_at_idx;
DROP INDEX IF EXISTS public.users_google_id_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.user_saved_words_user_id_word_library_id_key;
DROP INDEX IF EXISTS public.user_languages_user_id_language_id_role_key;
DROP INDEX IF EXISTS public.user_interests_user_id_topic_id_key;
DROP INDEX IF EXISTS public.topics_name_key;
DROP INDEX IF EXISTS public.post_likes_post_id_user_id_key;
DROP INDEX IF EXISTS public.notifications_user_id_created_at_idx;
DROP INDEX IF EXISTS public.messages_conversation_id_sent_at_idx;
DROP INDEX IF EXISTS public.matches_member_id_candidate_id_key;
DROP INDEX IF EXISTS public.match_scores_match_id_key;
DROP INDEX IF EXISTS public.match_preferences_user_id_key;
DROP INDEX IF EXISTS public.languages_code_key;
DROP INDEX IF EXISTS public.endorsements_giver_id_receiver_id_label_key;
DROP INDEX IF EXISTS public.conversations_match_id_key;
DROP INDEX IF EXISTS public.comment_likes_comment_id_user_id_key;
DROP INDEX IF EXISTS public.call_sessions_conversation_id_invited_at_idx;
DROP INDEX IF EXISTS public.call_sessions_caller_id_idx;
DROP INDEX IF EXISTS public.blocks_blocker_id_blocked_id_key;
ALTER TABLE IF EXISTS ONLY public.word_library DROP CONSTRAINT IF EXISTS word_library_pkey;
ALTER TABLE IF EXISTS ONLY public.vocab_words DROP CONSTRAINT IF EXISTS vocab_words_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_saved_words DROP CONSTRAINT IF EXISTS user_saved_words_pkey;
ALTER TABLE IF EXISTS ONLY public.user_languages DROP CONSTRAINT IF EXISTS user_languages_pkey;
ALTER TABLE IF EXISTS ONLY public.user_interests DROP CONSTRAINT IF EXISTS user_interests_pkey;
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS topics_pkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.schedule_requests DROP CONSTRAINT IF EXISTS schedule_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
ALTER TABLE IF EXISTS ONLY public.quizzes DROP CONSTRAINT IF EXISTS quizzes_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_submissions DROP CONSTRAINT IF EXISTS quiz_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.post_likes DROP CONSTRAINT IF EXISTS post_likes_pkey;
ALTER TABLE IF EXISTS ONLY public.post_comments DROP CONSTRAINT IF EXISTS post_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_pkey;
ALTER TABLE IF EXISTS ONLY public.match_scores DROP CONSTRAINT IF EXISTS match_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.match_preferences DROP CONSTRAINT IF EXISTS match_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.languages DROP CONSTRAINT IF EXISTS languages_pkey;
ALTER TABLE IF EXISTS ONLY public.interactions DROP CONSTRAINT IF EXISTS interactions_pkey;
ALTER TABLE IF EXISTS ONLY public.endorsements DROP CONSTRAINT IF EXISTS endorsements_pkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.comment_likes DROP CONSTRAINT IF EXISTS comment_likes_pkey;
ALTER TABLE IF EXISTS ONLY public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.blocks DROP CONSTRAINT IF EXISTS blocks_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_posts DROP CONSTRAINT IF EXISTS activity_posts_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.word_library ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vocab_words ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_saved_words ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_languages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_interests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.topics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.schedule_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quizzes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quiz_submissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quiz_questions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.post_likes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.post_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.moderation_actions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.matches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.match_scores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.match_preferences ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.languages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.interactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.endorsements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.conversations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.comment_likes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.call_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.blocks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.activity_posts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.word_library_id_seq;
DROP TABLE IF EXISTS public.word_library;
DROP SEQUENCE IF EXISTS public.vocab_words_id_seq;
DROP TABLE IF EXISTS public.vocab_words;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_saved_words_id_seq;
DROP TABLE IF EXISTS public.user_saved_words;
DROP SEQUENCE IF EXISTS public.user_languages_id_seq;
DROP TABLE IF EXISTS public.user_languages;
DROP SEQUENCE IF EXISTS public.user_interests_id_seq;
DROP TABLE IF EXISTS public.user_interests;
DROP SEQUENCE IF EXISTS public.topics_id_seq;
DROP TABLE IF EXISTS public.topics;
DROP SEQUENCE IF EXISTS public.subscriptions_id_seq;
DROP TABLE IF EXISTS public.subscriptions;
DROP SEQUENCE IF EXISTS public.schedule_requests_id_seq;
DROP TABLE IF EXISTS public.schedule_requests;
DROP SEQUENCE IF EXISTS public.reports_id_seq;
DROP TABLE IF EXISTS public.reports;
DROP SEQUENCE IF EXISTS public.quizzes_id_seq;
DROP TABLE IF EXISTS public.quizzes;
DROP SEQUENCE IF EXISTS public.quiz_submissions_id_seq;
DROP TABLE IF EXISTS public.quiz_submissions;
DROP SEQUENCE IF EXISTS public.quiz_questions_id_seq;
DROP TABLE IF EXISTS public.quiz_questions;
DROP SEQUENCE IF EXISTS public.post_likes_id_seq;
DROP TABLE IF EXISTS public.post_likes;
DROP SEQUENCE IF EXISTS public.post_comments_id_seq;
DROP TABLE IF EXISTS public.post_comments;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.moderation_actions_id_seq;
DROP TABLE IF EXISTS public.moderation_actions;
DROP SEQUENCE IF EXISTS public.messages_id_seq;
DROP TABLE IF EXISTS public.messages;
DROP SEQUENCE IF EXISTS public.matches_id_seq;
DROP TABLE IF EXISTS public.matches;
DROP SEQUENCE IF EXISTS public.match_scores_id_seq;
DROP TABLE IF EXISTS public.match_scores;
DROP SEQUENCE IF EXISTS public.match_preferences_id_seq;
DROP TABLE IF EXISTS public.match_preferences;
DROP SEQUENCE IF EXISTS public.languages_id_seq;
DROP TABLE IF EXISTS public.languages;
DROP SEQUENCE IF EXISTS public.interactions_id_seq;
DROP TABLE IF EXISTS public.interactions;
DROP SEQUENCE IF EXISTS public.endorsements_id_seq;
DROP TABLE IF EXISTS public.endorsements;
DROP SEQUENCE IF EXISTS public.conversations_id_seq;
DROP TABLE IF EXISTS public.conversations;
DROP SEQUENCE IF EXISTS public.comment_likes_id_seq;
DROP TABLE IF EXISTS public.comment_likes;
DROP SEQUENCE IF EXISTS public.call_sessions_id_seq;
DROP TABLE IF EXISTS public.call_sessions;
DROP SEQUENCE IF EXISTS public.blocks_id_seq;
DROP TABLE IF EXISTS public.blocks;
DROP SEQUENCE IF EXISTS public.activity_posts_id_seq;
DROP TABLE IF EXISTS public.activity_posts;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."VocabLabel";
DROP TYPE IF EXISTS public."UserStatus";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."ScheduleStatus";
DROP TYPE IF EXISTS public."SavedWordSource";
DROP TYPE IF EXISTS public."ReportStatus";
DROP TYPE IF EXISTS public."QuestionType";
DROP TYPE IF EXISTS public."ModerationActionType";
DROP TYPE IF EXISTS public."MessageType";
DROP TYPE IF EXISTS public."MatchStatus";
DROP TYPE IF EXISTS public."LanguageRole";
DROP TYPE IF EXISTS public."InteractionAction";
DROP TYPE IF EXISTS public."EndorsementLabel";
DROP TYPE IF EXISTS public."CallStatus";
DROP TYPE IF EXISTS public."CallKind";
DROP TYPE IF EXISTS public."ActivityPostType";
--
-- Name: ActivityPostType; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."ActivityPostType" AS ENUM (
    'word_public',
    'chat_hours_milestone',
    'user_post'
);


ALTER TYPE public."ActivityPostType" OWNER TO stududu;

--
-- Name: CallKind; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."CallKind" AS ENUM (
    'audio',
    'video'
);


ALTER TYPE public."CallKind" OWNER TO stududu;

--
-- Name: CallStatus; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."CallStatus" AS ENUM (
    'ringing',
    'connected',
    'ended',
    'rejected',
    'missed',
    'failed',
    'unavailable',
    'busy'
);


ALTER TYPE public."CallStatus" OWNER TO stududu;

--
-- Name: EndorsementLabel; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."EndorsementLabel" AS ENUM (
    'lang_proficiency',
    'social_knowledge',
    'niche_expertise',
    'friendliness'
);


ALTER TYPE public."EndorsementLabel" OWNER TO stududu;

--
-- Name: InteractionAction; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."InteractionAction" AS ENUM (
    'like',
    'skip'
);


ALTER TYPE public."InteractionAction" OWNER TO stududu;

--
-- Name: LanguageRole; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."LanguageRole" AS ENUM (
    'native',
    'fluent',
    'learning'
);


ALTER TYPE public."LanguageRole" OWNER TO stududu;

--
-- Name: MatchStatus; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."MatchStatus" AS ENUM (
    'liked',
    'mutual',
    'skipped',
    'expired'
);


ALTER TYPE public."MatchStatus" OWNER TO stududu;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."MessageType" AS ENUM (
    'text',
    'image',
    'schedule',
    'call',
    'quiz_result'
);


ALTER TYPE public."MessageType" OWNER TO stududu;

--
-- Name: ModerationActionType; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."ModerationActionType" AS ENUM (
    'warn',
    'suspend_3d',
    'suspend_1w',
    'hard_delete'
);


ALTER TYPE public."ModerationActionType" OWNER TO stududu;

--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."QuestionType" AS ENUM (
    'multiple_choice',
    'short_answer',
    'essay',
    'fill_in_the_blank'
);


ALTER TYPE public."QuestionType" OWNER TO stududu;

--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'open',
    'reviewed',
    'dismissed'
);


ALTER TYPE public."ReportStatus" OWNER TO stududu;

--
-- Name: SavedWordSource; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."SavedWordSource" AS ENUM (
    'chat',
    'manual'
);


ALTER TYPE public."SavedWordSource" OWNER TO stududu;

--
-- Name: ScheduleStatus; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."ScheduleStatus" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);


ALTER TYPE public."ScheduleStatus" OWNER TO stududu;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."UserRole" AS ENUM (
    'member',
    'admin'
);


ALTER TYPE public."UserRole" OWNER TO stududu;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'suspended',
    'deleted'
);


ALTER TYPE public."UserStatus" OWNER TO stududu;

--
-- Name: VocabLabel; Type: TYPE; Schema: public; Owner: stududu
--

CREATE TYPE public."VocabLabel" AS ENUM (
    'new',
    'good'
);


ALTER TYPE public."VocabLabel" OWNER TO stududu;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO stududu;

--
-- Name: activity_posts; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.activity_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type public."ActivityPostType" NOT NULL,
    content_ref text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text,
    image_url text
);


ALTER TABLE public.activity_posts OWNER TO stududu;

--
-- Name: activity_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.activity_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_posts_id_seq OWNER TO stududu;

--
-- Name: activity_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.activity_posts_id_seq OWNED BY public.activity_posts.id;


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.blocks (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.blocks OWNER TO stududu;

--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocks_id_seq OWNER TO stududu;

--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


--
-- Name: call_sessions; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.call_sessions (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    caller_id integer NOT NULL,
    callee_id integer NOT NULL,
    kind public."CallKind" DEFAULT 'audio'::public."CallKind" NOT NULL,
    status public."CallStatus" DEFAULT 'ringing'::public."CallStatus" NOT NULL,
    invited_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at timestamp(3) without time zone,
    ended_at timestamp(3) without time zone,
    duration_sec integer DEFAULT 0 NOT NULL,
    end_reason text
);


ALTER TABLE public.call_sessions OWNER TO stududu;

--
-- Name: call_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.call_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.call_sessions_id_seq OWNER TO stududu;

--
-- Name: call_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.call_sessions_id_seq OWNED BY public.call_sessions.id;


--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comment_likes OWNER TO stududu;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_likes_id_seq OWNER TO stududu;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.comment_likes_id_seq OWNED BY public.comment_likes.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    match_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversations OWNER TO stududu;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO stududu;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: endorsements; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.endorsements (
    id integer NOT NULL,
    giver_id integer NOT NULL,
    receiver_id integer NOT NULL,
    label public."EndorsementLabel" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.endorsements OWNER TO stududu;

--
-- Name: endorsements_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.endorsements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.endorsements_id_seq OWNER TO stududu;

--
-- Name: endorsements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.endorsements_id_seq OWNED BY public.endorsements.id;


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.interactions (
    id integer NOT NULL,
    match_id integer NOT NULL,
    user_id integer NOT NULL,
    action public."InteractionAction" NOT NULL,
    hidden_until timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.interactions OWNER TO stududu;

--
-- Name: interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interactions_id_seq OWNER TO stududu;

--
-- Name: interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.interactions_id_seq OWNED BY public.interactions.id;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.languages (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    framework text,
    hidden boolean DEFAULT false NOT NULL
);


ALTER TABLE public.languages OWNER TO stududu;

--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.languages_id_seq OWNER TO stududu;

--
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- Name: match_preferences; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.match_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    intent text,
    language_focus text,
    level_desired text
);


ALTER TABLE public.match_preferences OWNER TO stududu;

--
-- Name: match_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.match_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_preferences_id_seq OWNER TO stududu;

--
-- Name: match_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.match_preferences_id_seq OWNED BY public.match_preferences.id;


--
-- Name: match_scores; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.match_scores (
    id integer NOT NULL,
    match_id integer NOT NULL,
    lang_complement boolean NOT NULL,
    shared_topic_count integer DEFAULT 0 NOT NULL,
    intent_alignment boolean DEFAULT false NOT NULL,
    total double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.match_scores OWNER TO stududu;

--
-- Name: match_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.match_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_scores_id_seq OWNER TO stududu;

--
-- Name: match_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.match_scores_id_seq OWNED BY public.match_scores.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    member_id integer NOT NULL,
    candidate_id integer NOT NULL,
    status public."MatchStatus" DEFAULT 'liked'::public."MatchStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone
);


ALTER TABLE public.matches OWNER TO stududu;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO stududu;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    sent_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at timestamp(3) without time zone,
    payload jsonb,
    type public."MessageType" DEFAULT 'text'::public."MessageType" NOT NULL,
    reactions jsonb
);


ALTER TABLE public.messages OWNER TO stududu;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO stududu;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: moderation_actions; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.moderation_actions (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    target_user_id integer NOT NULL,
    action public."ModerationActionType" NOT NULL,
    reason text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.moderation_actions OWNER TO stududu;

--
-- Name: moderation_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.moderation_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moderation_actions_id_seq OWNER TO stududu;

--
-- Name: moderation_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.moderation_actions_id_seq OWNED BY public.moderation_actions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    sender_id integer,
    type text NOT NULL,
    message text NOT NULL,
    reference_id integer,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO stududu;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO stududu;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.post_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    parent_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_comments OWNER TO stududu;

--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_comments_id_seq OWNER TO stududu;

--
-- Name: post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.post_comments_id_seq OWNED BY public.post_comments.id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_likes OWNER TO stududu;

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_likes_id_seq OWNER TO stududu;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.quiz_questions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    question_text text NOT NULL,
    type public."QuestionType" DEFAULT 'multiple_choice'::public."QuestionType" NOT NULL,
    options jsonb,
    correct_answer text NOT NULL,
    explanation text
);


ALTER TABLE public.quiz_questions OWNER TO stududu;

--
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.quiz_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_questions_id_seq OWNER TO stududu;

--
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- Name: quiz_submissions; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.quiz_submissions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    user_id integer NOT NULL,
    score double precision DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    answers jsonb NOT NULL,
    feedback text,
    question_feedbacks jsonb,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.quiz_submissions OWNER TO stududu;

--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.quiz_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_submissions_id_seq OWNER TO stududu;

--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.quiz_submissions_id_seq OWNED BY public.quiz_submissions.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    creator_id integer NOT NULL,
    title text NOT NULL,
    description text,
    language_id integer,
    time_limit_minutes integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.quizzes OWNER TO stududu;

--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quizzes_id_seq OWNER TO stududu;

--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    reporter_id integer NOT NULL,
    reported_id integer NOT NULL,
    reason text NOT NULL,
    status public."ReportStatus" DEFAULT 'open'::public."ReportStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    target_id integer,
    target_type text
);


ALTER TABLE public.reports OWNER TO stududu;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO stududu;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: schedule_requests; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.schedule_requests (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    proposer_id integer NOT NULL,
    proposed_time_utc timestamp(3) without time zone NOT NULL,
    status public."ScheduleStatus" DEFAULT 'pending'::public."ScheduleStatus" NOT NULL,
    reminder_sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.schedule_requests OWNER TO stududu;

--
-- Name: schedule_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.schedule_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_requests_id_seq OWNER TO stududu;

--
-- Name: schedule_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.schedule_requests_id_seq OWNED BY public.schedule_requests.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    amount double precision DEFAULT 0 NOT NULL,
    payment_method text DEFAULT 'mock'::text NOT NULL,
    start_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO stududu;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO stududu;

--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: topics; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    name text NOT NULL,
    hidden boolean DEFAULT false NOT NULL
);


ALTER TABLE public.topics OWNER TO stududu;

--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topics_id_seq OWNER TO stududu;

--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: user_interests; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.user_interests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    topic_id integer NOT NULL
);


ALTER TABLE public.user_interests OWNER TO stududu;

--
-- Name: user_interests_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.user_interests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_interests_id_seq OWNER TO stududu;

--
-- Name: user_interests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.user_interests_id_seq OWNED BY public.user_interests.id;


--
-- Name: user_languages; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.user_languages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    language_id integer NOT NULL,
    role public."LanguageRole" NOT NULL,
    level text
);


ALTER TABLE public.user_languages OWNER TO stududu;

--
-- Name: user_languages_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.user_languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_languages_id_seq OWNER TO stududu;

--
-- Name: user_languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.user_languages_id_seq OWNED BY public.user_languages.id;


--
-- Name: user_saved_words; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.user_saved_words (
    id integer NOT NULL,
    user_id integer NOT NULL,
    word_library_id integer NOT NULL,
    personal_note text,
    source public."SavedWordSource" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'learning'::text NOT NULL
);


ALTER TABLE public.user_saved_words OWNER TO stududu;

--
-- Name: user_saved_words_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.user_saved_words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_saved_words_id_seq OWNER TO stududu;

--
-- Name: user_saved_words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.user_saved_words_id_seq OWNED BY public.user_saved_words.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text,
    display_name text NOT NULL,
    avatar_url text,
    bio text,
    intent text,
    role public."UserRole" DEFAULT 'member'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    suspended_until timestamp(3) without time zone,
    last_active timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    available_slots text[] DEFAULT ARRAY[]::text[],
    timezone text DEFAULT 'VN'::text,
    city text,
    dob timestamp(3) without time zone,
    gender text,
    share_activity boolean DEFAULT true NOT NULL,
    google_id text,
    country text,
    is_pro boolean DEFAULT false NOT NULL,
    pro_expires_at timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO stududu;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO stududu;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vocab_words; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.vocab_words (
    id integer NOT NULL,
    user_id integer NOT NULL,
    word text NOT NULL,
    translation text NOT NULL,
    language text NOT NULL,
    flag text,
    label public."VocabLabel" DEFAULT 'new'::public."VocabLabel" NOT NULL,
    note text,
    from_partner text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vocab_words OWNER TO stududu;

--
-- Name: vocab_words_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.vocab_words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vocab_words_id_seq OWNER TO stududu;

--
-- Name: vocab_words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.vocab_words_id_seq OWNED BY public.vocab_words.id;


--
-- Name: word_library; Type: TABLE; Schema: public; Owner: stududu
--

CREATE TABLE public.word_library (
    id integer NOT NULL,
    term character varying(100) NOT NULL,
    language_id integer NOT NULL,
    definition text,
    example text,
    save_count integer DEFAULT 0 NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    updated_by_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    audio_url text,
    part_of_speech text,
    phonetic text
);


ALTER TABLE public.word_library OWNER TO stududu;

--
-- Name: word_library_id_seq; Type: SEQUENCE; Schema: public; Owner: stududu
--

CREATE SEQUENCE public.word_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.word_library_id_seq OWNER TO stududu;

--
-- Name: word_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stududu
--

ALTER SEQUENCE public.word_library_id_seq OWNED BY public.word_library.id;


--
-- Name: activity_posts id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.activity_posts ALTER COLUMN id SET DEFAULT nextval('public.activity_posts_id_seq'::regclass);


--
-- Name: blocks id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.blocks ALTER COLUMN id SET DEFAULT nextval('public.blocks_id_seq'::regclass);


--
-- Name: call_sessions id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.call_sessions ALTER COLUMN id SET DEFAULT nextval('public.call_sessions_id_seq'::regclass);


--
-- Name: comment_likes id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.comment_likes ALTER COLUMN id SET DEFAULT nextval('public.comment_likes_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: endorsements id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.endorsements ALTER COLUMN id SET DEFAULT nextval('public.endorsements_id_seq'::regclass);


--
-- Name: interactions id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.interactions ALTER COLUMN id SET DEFAULT nextval('public.interactions_id_seq'::regclass);


--
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- Name: match_preferences id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.match_preferences ALTER COLUMN id SET DEFAULT nextval('public.match_preferences_id_seq'::regclass);


--
-- Name: match_scores id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.match_scores ALTER COLUMN id SET DEFAULT nextval('public.match_scores_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: moderation_actions id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.moderation_actions ALTER COLUMN id SET DEFAULT nextval('public.moderation_actions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: post_comments id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_comments ALTER COLUMN id SET DEFAULT nextval('public.post_comments_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- Name: quiz_submissions id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_submissions ALTER COLUMN id SET DEFAULT nextval('public.quiz_submissions_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: schedule_requests id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.schedule_requests ALTER COLUMN id SET DEFAULT nextval('public.schedule_requests_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Name: user_interests id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_interests ALTER COLUMN id SET DEFAULT nextval('public.user_interests_id_seq'::regclass);


--
-- Name: user_languages id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_languages ALTER COLUMN id SET DEFAULT nextval('public.user_languages_id_seq'::regclass);


--
-- Name: user_saved_words id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_saved_words ALTER COLUMN id SET DEFAULT nextval('public.user_saved_words_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vocab_words id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.vocab_words ALTER COLUMN id SET DEFAULT nextval('public.vocab_words_id_seq'::regclass);


--
-- Name: word_library id; Type: DEFAULT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.word_library ALTER COLUMN id SET DEFAULT nextval('public.word_library_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public._prisma_migrations VALUES ('3ae66184-f26c-43df-85ee-ab64fe8c15f7', '59689a7eb0af176ecb738be4c8d3c1043e728ed63b92f12d069db24fd5ea9779', '2026-08-15 16:45:26.064746+07', '20260707053244_init', NULL, NULL, '2026-08-15 16:45:25.91704+07', 1);
INSERT INTO public._prisma_migrations VALUES ('e3629ede-0d03-4d6a-93d3-c649ed568f2c', 'ea527247f5a686140ab619e0a42af5419fce8b781b611640d3285df030803f6f', '2026-08-15 16:45:26.270579+07', '20260728000000_add_call_session', NULL, NULL, '2026-08-15 16:45:26.251554+07', 1);
INSERT INTO public._prisma_migrations VALUES ('96a66b64-05d0-45d2-a632-33670862afff', '597eedbe405385bacdeeabecf0947979497268661735970688470384c31330bc', '2026-08-15 16:45:26.085635+07', '20260707091223_add_vocab_timezone_message_types', NULL, NULL, '2026-08-15 16:45:26.066311+07', 1);
INSERT INTO public._prisma_migrations VALUES ('96750f4f-1a98-4236-ad43-41ad2e2dc4ce', '16a6c7b3be25bce531d47846b5f832522443eeb1a90bbe5fd8b890fc105c3790', '2026-08-15 16:45:26.089805+07', '20260707141804_add_user_personal_info', NULL, NULL, '2026-08-15 16:45:26.086683+07', 1);
INSERT INTO public._prisma_migrations VALUES ('875d446f-6f8c-431a-a8d5-a10a3e696234', 'c14af8eed4c7f5d8405b5bb8cf24e0c287d1a31a7a55594ce6056fa057e5a62a', '2026-08-15 16:45:26.094807+07', '20260708021506_add_catalog_hidden_flag', NULL, NULL, '2026-08-15 16:45:26.090782+07', 1);
INSERT INTO public._prisma_migrations VALUES ('ff385a3c-a317-42dc-bdf4-7f4bdc4ddc1b', '283d706bbf5b975f46ed959457edbf9c1d6f7a88847d1a01de6c0ec79056c28e', '2026-08-15 16:45:26.154158+07', '20260709073149_srs_v3_vocab_trust_community_schedule', NULL, NULL, '2026-08-15 16:45:26.096235+07', 1);
INSERT INTO public._prisma_migrations VALUES ('258c3d02-bb70-48a5-a812-1b9babca31d8', 'a47658fe4c3b5dbb5ccf64766814d314a23c0fe57a60557e48483221575b4667', '2026-08-15 16:45:26.158401+07', '20260713020941_add_user_post', NULL, NULL, '2026-08-15 16:45:26.155225+07', 1);
INSERT INTO public._prisma_migrations VALUES ('133a7855-223f-41c0-a027-da8c783ba309', '13ba0a494fb52ce53d3d40d521bc9c7b910c77ffeef60a60fdb43444f37349ad', '2026-08-15 16:45:26.163308+07', '20260714071441_add_image_to_post', NULL, NULL, '2026-08-15 16:45:26.159838+07', 1);
INSERT INTO public._prisma_migrations VALUES ('dac276d9-55a6-4b6f-be3c-35c0ef3fc1bd', '3765069361f93a745aedb59c3a12e508e459b62a8cf8f467a510044d824a5f05', '2026-08-15 16:45:26.181222+07', '20260714071903_add_comments_to_post', NULL, NULL, '2026-08-15 16:45:26.164256+07', 1);
INSERT INTO public._prisma_migrations VALUES ('5ade4ab7-1323-413a-b96b-88af0335af4f', '4d8f16563b3ecaf38e5156d2f973a3ada8639e3c44dcde8dd60e315c9eec85b0', '2026-08-15 16:45:26.200444+07', '20260714073014_add_comment_replies_and_likes', NULL, NULL, '2026-08-15 16:45:26.182477+07', 1);
INSERT INTO public._prisma_migrations VALUES ('fc38e0ad-79bd-4cd5-9757-e16cc0be8ee3', 'f95f64001a6df315d854e70176c81c2a497152f9d831b1ade15985a5912f62bd', '2026-08-15 16:45:26.207138+07', '20260717013400_add_google_auth', NULL, NULL, '2026-08-15 16:45:26.201286+07', 1);
INSERT INTO public._prisma_migrations VALUES ('6ddd61ef-45b3-44d7-ab61-4616df2c94d8', 'f1ab34c91447031d1d4f8e5815ed3e9ffdbd123ce50072594d1dffe4cf5d1201', '2026-08-15 16:45:26.21173+07', '20260721014414_add_word_level', NULL, NULL, '2026-08-15 16:45:26.207997+07', 1);
INSERT INTO public._prisma_migrations VALUES ('712f6bd6-caa4-49d9-9f11-92faa5f7cbb2', '8f7cc0440cebb9043379a1f24597d0afabb346d32b464d8b4612191be980ec55', '2026-08-15 16:45:26.218087+07', '20260721014807_remove_word_level', NULL, NULL, '2026-08-15 16:45:26.213821+07', 1);
INSERT INTO public._prisma_migrations VALUES ('c4b1121e-3894-46f4-b0d1-d1ec7e56374c', 'a8f112aa1a84bf41a6753e8017ded1f1dd436de7458c0f9562ae776e24745201', '2026-08-15 16:45:26.250444+07', '20260722013736_add_notification_model', NULL, NULL, '2026-08-15 16:45:26.219131+07', 1);


--
-- Data for Name: activity_posts; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.activity_posts VALUES (1, 2, 'user_post', NULL, '2026-08-15 09:46:06.29', 'Xin chào mọi người! Mình là Bé Khót. Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (2, 3, 'user_post', NULL, '2026-08-15 09:46:06.319', 'Xin chào mọi người! Mình là Sarah Jenkins. Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (3, 4, 'user_post', NULL, '2026-08-15 09:46:06.346', 'Xin chào mọi người! Mình là Kenji Sato (佐藤健司). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (4, 5, 'user_post', NULL, '2026-08-15 09:46:06.373', 'Xin chào mọi người! Mình là Li Wei (李伟). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (5, 6, 'user_post', NULL, '2026-08-15 09:46:06.4', 'Xin chào mọi người! Mình là Min-jun Park (박민준). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (6, 7, 'user_post', NULL, '2026-08-15 09:46:06.425', 'Xin chào mọi người! Mình là Emma Dupont. Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (7, 8, 'user_post', NULL, '2026-08-15 09:46:06.454', 'Xin chào mọi người! Mình là Alex Miller. Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (8, 9, 'user_post', NULL, '2026-08-15 09:46:06.474', 'Xin chào mọi người! Mình là Thành Viên 1 (Member 1). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (9, 10, 'user_post', NULL, '2026-08-15 09:46:06.494', 'Xin chào mọi người! Mình là Thành Viên 2 (Member 2). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (10, 11, 'user_post', NULL, '2026-08-15 09:46:06.515', 'Xin chào mọi người! Mình là User 1 (Nguyễn Văn A). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (11, 12, 'user_post', NULL, '2026-08-15 09:46:06.537', 'Xin chào mọi người! Mình là User 2 (Trần Thị B). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (12, 13, 'user_post', NULL, '2026-08-15 09:46:06.557', 'Xin chào mọi người! Mình là User 3 (Lê Hoàng C). Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (13, 14, 'user_post', NULL, '2026-08-15 09:46:06.575', 'Xin chào mọi người! Mình là John Smith. Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);
INSERT INTO public.activity_posts VALUES (14, 15, 'user_post', NULL, '2026-08-15 09:46:06.595', 'Xin chào mọi người! Mình là Jessica Taylor. Rất vui được gặp và học cùng các bạn trên Stududu!', NULL);


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: call_sessions; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.conversations VALUES (1, 1, '2026-08-15 09:46:06.612');
INSERT INTO public.conversations VALUES (2, 2, '2026-08-15 09:46:06.631');
INSERT INTO public.conversations VALUES (3, 3, '2026-08-15 09:46:06.642');
INSERT INTO public.conversations VALUES (4, 4, '2026-08-15 09:46:06.655');
INSERT INTO public.conversations VALUES (5, 5, '2026-08-15 09:46:06.667');


--
-- Data for Name: endorsements; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: interactions; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.languages VALUES (1, 'vi', 'Tiếng Việt', 'CEFR', false);
INSERT INTO public.languages VALUES (2, 'en', 'English', 'CEFR', false);
INSERT INTO public.languages VALUES (3, 'zh', '中文', 'CEFR', false);
INSERT INTO public.languages VALUES (4, 'ja', '日本語', 'CEFR', false);
INSERT INTO public.languages VALUES (5, 'ko', '한국어', 'CEFR', false);
INSERT INTO public.languages VALUES (6, 'fr', 'Français', 'CEFR', false);
INSERT INTO public.languages VALUES (7, 'es', 'Español', 'CEFR', false);
INSERT INTO public.languages VALUES (8, 'de', 'Deutsch', 'CEFR', false);


--
-- Data for Name: match_preferences; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: match_scores; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.matches VALUES (1, 2, 3, 'mutual', '2026-08-15 09:46:06.603', NULL);
INSERT INTO public.matches VALUES (2, 2, 8, 'mutual', '2026-08-15 09:46:06.625', NULL);
INSERT INTO public.matches VALUES (3, 2, 5, 'mutual', '2026-08-15 09:46:06.638', NULL);
INSERT INTO public.matches VALUES (4, 2, 4, 'mutual', '2026-08-15 09:46:06.652', NULL);
INSERT INTO public.matches VALUES (5, 2, 7, 'mutual', '2026-08-15 09:46:06.663', NULL);


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.messages VALUES (1, 1, 3, 'Hi Bé Khót! How are you today?', '2026-08-15 09:46:06.615', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (2, 1, 3, 'Nice to meet you! Are you free for language practice?', '2026-08-15 09:46:06.62', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (3, 2, 8, 'Chào bạn! Mình có thể giúp bạn luyện Tiếng Anh giao tiếp nhé.', '2026-08-15 09:46:06.633', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (4, 2, 8, 'Bạn rảnh khi nào?', '2026-08-15 09:46:06.635', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (5, 3, 5, '你好! Hello from Beijing!', '2026-08-15 09:46:06.645', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (6, 3, 5, 'Let us exchange Vietnamese and Mandarin.', '2026-08-15 09:46:06.649', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (7, 4, 4, 'Konnichiwa! Glad to connect with you.', '2026-08-15 09:46:06.657', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (8, 4, 4, 'I am learning English too!', '2026-08-15 09:46:06.659', NULL, NULL, 'text', NULL);
INSERT INTO public.messages VALUES (9, 5, 7, 'Bonjour Bé Khót! How is your day going?', '2026-08-15 09:46:06.669', NULL, NULL, 'text', NULL);


--
-- Data for Name: moderation_actions; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: quiz_submissions; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: schedule_requests; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.topics VALUES (1, 'Travel', false);
INSERT INTO public.topics VALUES (2, 'Music', false);
INSERT INTO public.topics VALUES (3, 'Movies', false);
INSERT INTO public.topics VALUES (4, 'Food & Culinary', false);
INSERT INTO public.topics VALUES (5, 'Sports', false);
INSERT INTO public.topics VALUES (6, 'Technology', false);
INSERT INTO public.topics VALUES (7, 'Books', false);
INSERT INTO public.topics VALUES (8, 'Gaming', false);
INSERT INTO public.topics VALUES (9, 'Culture', false);
INSERT INTO public.topics VALUES (10, 'Exams (IELTS/TOEIC…)', false);


--
-- Data for Name: user_interests; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.user_interests VALUES (1, 2, 1);
INSERT INTO public.user_interests VALUES (2, 2, 2);
INSERT INTO public.user_interests VALUES (3, 2, 4);
INSERT INTO public.user_interests VALUES (4, 3, 1);
INSERT INTO public.user_interests VALUES (5, 3, 4);
INSERT INTO public.user_interests VALUES (6, 3, 9);
INSERT INTO public.user_interests VALUES (7, 4, 6);
INSERT INTO public.user_interests VALUES (8, 4, 8);
INSERT INTO public.user_interests VALUES (9, 4, 2);
INSERT INTO public.user_interests VALUES (10, 5, 7);
INSERT INTO public.user_interests VALUES (11, 5, 9);
INSERT INTO public.user_interests VALUES (12, 5, 10);
INSERT INTO public.user_interests VALUES (13, 6, 2);
INSERT INTO public.user_interests VALUES (14, 6, 3);
INSERT INTO public.user_interests VALUES (15, 6, 1);
INSERT INTO public.user_interests VALUES (16, 7, 7);
INSERT INTO public.user_interests VALUES (17, 7, 9);
INSERT INTO public.user_interests VALUES (18, 7, 4);
INSERT INTO public.user_interests VALUES (19, 8, 10);
INSERT INTO public.user_interests VALUES (20, 8, 5);
INSERT INTO public.user_interests VALUES (21, 8, 1);
INSERT INTO public.user_interests VALUES (22, 9, 2);
INSERT INTO public.user_interests VALUES (23, 9, 3);
INSERT INTO public.user_interests VALUES (24, 10, 8);
INSERT INTO public.user_interests VALUES (25, 10, 6);
INSERT INTO public.user_interests VALUES (26, 11, 10);
INSERT INTO public.user_interests VALUES (27, 11, 6);
INSERT INTO public.user_interests VALUES (28, 12, 9);
INSERT INTO public.user_interests VALUES (29, 12, 7);
INSERT INTO public.user_interests VALUES (30, 13, 1);
INSERT INTO public.user_interests VALUES (31, 13, 4);
INSERT INTO public.user_interests VALUES (32, 14, 5);
INSERT INTO public.user_interests VALUES (33, 14, 4);
INSERT INTO public.user_interests VALUES (34, 15, 1);
INSERT INTO public.user_interests VALUES (35, 15, 9);


--
-- Data for Name: user_languages; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.user_languages VALUES (1, 2, 1, 'native', NULL);
INSERT INTO public.user_languages VALUES (2, 2, 2, 'learning', '3');
INSERT INTO public.user_languages VALUES (3, 3, 2, 'native', NULL);
INSERT INTO public.user_languages VALUES (4, 3, 1, 'learning', '3');
INSERT INTO public.user_languages VALUES (5, 4, 4, 'native', NULL);
INSERT INTO public.user_languages VALUES (6, 4, 2, 'learning', '4');
INSERT INTO public.user_languages VALUES (7, 5, 3, 'native', NULL);
INSERT INTO public.user_languages VALUES (8, 5, 1, 'learning', '3');
INSERT INTO public.user_languages VALUES (9, 6, 5, 'native', NULL);
INSERT INTO public.user_languages VALUES (10, 6, 2, 'learning', '3');
INSERT INTO public.user_languages VALUES (11, 7, 6, 'native', NULL);
INSERT INTO public.user_languages VALUES (12, 7, 1, 'learning', '2');
INSERT INTO public.user_languages VALUES (13, 8, 2, 'native', NULL);
INSERT INTO public.user_languages VALUES (14, 8, 1, 'learning', '4');
INSERT INTO public.user_languages VALUES (15, 9, 1, 'native', NULL);
INSERT INTO public.user_languages VALUES (16, 9, 2, 'learning', '2');
INSERT INTO public.user_languages VALUES (17, 10, 1, 'native', NULL);
INSERT INTO public.user_languages VALUES (18, 10, 4, 'learning', '3');
INSERT INTO public.user_languages VALUES (19, 11, 1, 'native', NULL);
INSERT INTO public.user_languages VALUES (20, 11, 2, 'learning', '4');
INSERT INTO public.user_languages VALUES (21, 12, 1, 'native', NULL);
INSERT INTO public.user_languages VALUES (22, 12, 3, 'learning', '4');
INSERT INTO public.user_languages VALUES (23, 13, 1, 'native', NULL);
INSERT INTO public.user_languages VALUES (24, 13, 7, 'learning', '2');
INSERT INTO public.user_languages VALUES (25, 14, 2, 'native', NULL);
INSERT INTO public.user_languages VALUES (26, 14, 1, 'learning', '2');
INSERT INTO public.user_languages VALUES (27, 15, 2, 'native', NULL);
INSERT INTO public.user_languages VALUES (28, 15, 1, 'learning', '1');


--
-- Data for Name: user_saved_words; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: stududu
--

INSERT INTO public.users VALUES (1, 'admin@stududu.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'System Admin', NULL, NULL, NULL, 'admin', 'active', NULL, NULL, '2026-08-15 09:46:06.237', '{}', 'VN', NULL, NULL, NULL, true, NULL, NULL, false, NULL);
INSERT INTO public.users VALUES (3, 'sarah.jenkins@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Sarah Jenkins', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Hi! I am from London. I love Vietnamese street food and culture! Looking for a Tandem partner to practice conversational Vietnamese.', 'Giao tiếp hằng ngày', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.294', '{}', 'VN', 'London', NULL, NULL, true, NULL, 'UK', true, NULL);
INSERT INTO public.users VALUES (4, 'kenji.sato@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Kenji Sato (佐藤健司)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Konnichiwa! Software engineer living in Tokyo. Interested in tech, anime, and learning languages.', 'Học tập & Công việc', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.321', '{}', 'VN', 'Tokyo', NULL, NULL, true, NULL, 'Japan', false, NULL);
INSERT INTO public.users VALUES (5, 'liwei@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Li Wei (李伟)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Hello! Business manager learning Vietnamese for trade. Happy to teach Mandarin!', 'Học tập & Công việc', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.348', '{}', 'VN', 'Beijing', NULL, NULL, true, NULL, 'China', true, NULL);
INSERT INTO public.users VALUES (6, 'minjun.park@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Min-jun Park (박민준)', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'K-pop & music enthusiast from Seoul. Let us exchange Korean and English/Vietnamese!', 'Kết bạn & Trải nghiệm', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.375', '{}', 'VN', 'Seoul', NULL, NULL, true, NULL, 'Korea', false, NULL);
INSERT INTO public.users VALUES (7, 'emma.dupont@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Emma Dupont', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Bonjour! Architect from Paris. Passionate about art, literature, and Southeast Asian culture.', 'Kết bạn & Trải nghiệm', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.402', '{}', 'VN', 'Paris', NULL, NULL, true, NULL, 'France', true, NULL);
INSERT INTO public.users VALUES (8, 'alex.miller@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Alex Miller', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 'English teacher living in Da Nang. Want to practice advanced Vietnamese and share English tips!', 'Luyện thi chứng chỉ', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.428', '{}', 'VN', 'Đà Nẵng', NULL, NULL, true, NULL, 'Vietnam', false, NULL);
INSERT INTO public.users VALUES (9, 'member1@stududu.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Thành Viên 1 (Member 1)', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Chào mọi người! Rất vui được tham gia cộng đồng Tandem Stududu.', 'Giao tiếp hằng ngày', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.456', '{}', 'VN', 'Hà Nội', NULL, NULL, true, NULL, 'Vietnam', false, NULL);
INSERT INTO public.users VALUES (10, 'member2@stududu.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Thành Viên 2 (Member 2)', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 'Thích học tiếng Nhật và giao lưu với bạn bè quốc tế.', 'Kết bạn & Trải nghiệm', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.476', '{}', 'VN', 'Đà Nẵng', NULL, NULL, true, NULL, 'Vietnam', true, NULL);
INSERT INTO public.users VALUES (11, 'user1@gmail.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'User 1 (Nguyễn Văn A)', 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150', 'Sinh viên ngành ngôn ngữ Anh. Muốn tìm bạn bản xứ trao đổi.', 'Học tập & Công việc', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.497', '{}', 'VN', 'TP. Hồ Chí Minh', NULL, NULL, true, NULL, 'Vietnam', false, NULL);
INSERT INTO public.users VALUES (12, 'user2@gmail.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'User 2 (Trần Thị B)', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150', 'Đam mê văn hóa Trung Quốc, muốn nâng cao kỹ năng nghe nói HSK5.', 'Luyện thi chứng chỉ', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.519', '{}', 'VN', 'Hà Nội', NULL, NULL, true, NULL, 'Vietnam', true, NULL);
INSERT INTO public.users VALUES (13, 'user3@gmail.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'User 3 (Lê Hoàng C)', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'Thích du lịch, ẩm thực và nói tiếng Tây Ban Nha.', 'Kết bạn & Trải nghiệm', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.539', '{}', 'VN', 'Cần Thơ', NULL, NULL, true, NULL, 'Vietnam', false, NULL);
INSERT INTO public.users VALUES (14, 'john.smith@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'John Smith', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Hello! Expat living in Saigon. Happy to help you with English!', 'Giao tiếp hằng ngày', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.559', '{}', 'VN', 'TP. Hồ Chí Minh', NULL, NULL, true, NULL, 'Vietnam', true, NULL);
INSERT INTO public.users VALUES (15, 'jessica.taylor@example.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Jessica Taylor', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Digital nomad travelling across Vietnam. Love learning basic Vietnamese phrases!', 'Kết bạn & Trải nghiệm', 'member', 'active', NULL, NULL, '2026-08-15 09:46:06.577', '{}', 'VN', 'Hội An', NULL, NULL, true, NULL, 'Vietnam', false, NULL);
INSERT INTO public.users VALUES (2, 'bekhot123@gmail.com', '$2b$10$vlXijWeFFoSNV.n5Iv2SF.3V9k/7G3x8yVDO0yOLTlYwdClYSR.Sy', 'Bé Khót', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Người học Tiếng Anh đam mê văn hóa và giao lưu ngôn ngữ Tandem.', 'Giao tiếp hằng ngày', 'member', 'active', NULL, '2026-08-15 09:56:27.364', '2026-08-15 09:46:06.247', '{}', 'VN', 'TP. Hồ Chí Minh', NULL, NULL, true, NULL, 'Vietnam', true, NULL);


--
-- Data for Name: vocab_words; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Data for Name: word_library; Type: TABLE DATA; Schema: public; Owner: stududu
--



--
-- Name: activity_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.activity_posts_id_seq', 14, true);


--
-- Name: blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.blocks_id_seq', 1, false);


--
-- Name: call_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.call_sessions_id_seq', 1, false);


--
-- Name: comment_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.comment_likes_id_seq', 1, false);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.conversations_id_seq', 5, true);


--
-- Name: endorsements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.endorsements_id_seq', 1, false);


--
-- Name: interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.interactions_id_seq', 1, false);


--
-- Name: languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.languages_id_seq', 8, true);


--
-- Name: match_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.match_preferences_id_seq', 1, false);


--
-- Name: match_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.match_scores_id_seq', 1, false);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.matches_id_seq', 5, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.messages_id_seq', 9, true);


--
-- Name: moderation_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.moderation_actions_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.post_comments_id_seq', 1, false);


--
-- Name: post_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.post_likes_id_seq', 1, false);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 1, false);


--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.quiz_submissions_id_seq', 1, false);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: schedule_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.schedule_requests_id_seq', 1, false);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, false);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.topics_id_seq', 10, true);


--
-- Name: user_interests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.user_interests_id_seq', 35, true);


--
-- Name: user_languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.user_languages_id_seq', 28, true);


--
-- Name: user_saved_words_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.user_saved_words_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.users_id_seq', 15, true);


--
-- Name: vocab_words_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.vocab_words_id_seq', 1, false);


--
-- Name: word_library_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stududu
--

SELECT pg_catalog.setval('public.word_library_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_posts activity_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.activity_posts
    ADD CONSTRAINT activity_posts_pkey PRIMARY KEY (id);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: call_sessions call_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: endorsements endorsements_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: match_preferences match_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.match_preferences
    ADD CONSTRAINT match_preferences_pkey PRIMARY KEY (id);


--
-- Name: match_scores match_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.match_scores
    ADD CONSTRAINT match_scores_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_actions moderation_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.moderation_actions
    ADD CONSTRAINT moderation_actions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_submissions quiz_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: schedule_requests schedule_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.schedule_requests
    ADD CONSTRAINT schedule_requests_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: user_interests user_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_pkey PRIMARY KEY (id);


--
-- Name: user_languages user_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_languages
    ADD CONSTRAINT user_languages_pkey PRIMARY KEY (id);


--
-- Name: user_saved_words user_saved_words_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_saved_words
    ADD CONSTRAINT user_saved_words_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vocab_words vocab_words_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.vocab_words
    ADD CONSTRAINT vocab_words_pkey PRIMARY KEY (id);


--
-- Name: word_library word_library_pkey; Type: CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.word_library
    ADD CONSTRAINT word_library_pkey PRIMARY KEY (id);


--
-- Name: blocks_blocker_id_blocked_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX blocks_blocker_id_blocked_id_key ON public.blocks USING btree (blocker_id, blocked_id);


--
-- Name: call_sessions_caller_id_idx; Type: INDEX; Schema: public; Owner: stududu
--

CREATE INDEX call_sessions_caller_id_idx ON public.call_sessions USING btree (caller_id);


--
-- Name: call_sessions_conversation_id_invited_at_idx; Type: INDEX; Schema: public; Owner: stududu
--

CREATE INDEX call_sessions_conversation_id_invited_at_idx ON public.call_sessions USING btree (conversation_id, invited_at);


--
-- Name: comment_likes_comment_id_user_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX comment_likes_comment_id_user_id_key ON public.comment_likes USING btree (comment_id, user_id);


--
-- Name: conversations_match_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX conversations_match_id_key ON public.conversations USING btree (match_id);


--
-- Name: endorsements_giver_id_receiver_id_label_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX endorsements_giver_id_receiver_id_label_key ON public.endorsements USING btree (giver_id, receiver_id, label);


--
-- Name: languages_code_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX languages_code_key ON public.languages USING btree (code);


--
-- Name: match_preferences_user_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX match_preferences_user_id_key ON public.match_preferences USING btree (user_id);


--
-- Name: match_scores_match_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX match_scores_match_id_key ON public.match_scores USING btree (match_id);


--
-- Name: matches_member_id_candidate_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX matches_member_id_candidate_id_key ON public.matches USING btree (member_id, candidate_id);


--
-- Name: messages_conversation_id_sent_at_idx; Type: INDEX; Schema: public; Owner: stududu
--

CREATE INDEX messages_conversation_id_sent_at_idx ON public.messages USING btree (conversation_id, sent_at);


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: stududu
--

CREATE INDEX notifications_user_id_created_at_idx ON public.notifications USING btree (user_id, created_at);


--
-- Name: post_likes_post_id_user_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX post_likes_post_id_user_id_key ON public.post_likes USING btree (post_id, user_id);


--
-- Name: topics_name_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX topics_name_key ON public.topics USING btree (name);


--
-- Name: user_interests_user_id_topic_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX user_interests_user_id_topic_id_key ON public.user_interests USING btree (user_id, topic_id);


--
-- Name: user_languages_user_id_language_id_role_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX user_languages_user_id_language_id_role_key ON public.user_languages USING btree (user_id, language_id, role);


--
-- Name: user_saved_words_user_id_word_library_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX user_saved_words_user_id_word_library_id_key ON public.user_saved_words USING btree (user_id, word_library_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_google_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX users_google_id_key ON public.users USING btree (google_id);


--
-- Name: vocab_words_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: stududu
--

CREATE INDEX vocab_words_user_id_created_at_idx ON public.vocab_words USING btree (user_id, created_at);


--
-- Name: word_library_term_language_id_key; Type: INDEX; Schema: public; Owner: stududu
--

CREATE UNIQUE INDEX word_library_term_language_id_key ON public.word_library USING btree (term, language_id);


--
-- Name: activity_posts activity_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.activity_posts
    ADD CONSTRAINT activity_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blocks blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: blocks blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_sessions call_sessions_callee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_callee_id_fkey FOREIGN KEY (callee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_sessions call_sessions_caller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_sessions call_sessions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.call_sessions
    ADD CONSTRAINT call_sessions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: endorsements endorsements_giver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_giver_id_fkey FOREIGN KEY (giver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: endorsements endorsements_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.endorsements
    ADD CONSTRAINT endorsements_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interactions interactions_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interactions interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: match_preferences match_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.match_preferences
    ADD CONSTRAINT match_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_scores match_scores_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.match_scores
    ADD CONSTRAINT match_scores_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: matches matches_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: moderation_actions moderation_actions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.moderation_actions
    ADD CONSTRAINT moderation_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: moderation_actions moderation_actions_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.moderation_actions
    ADD CONSTRAINT moderation_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.post_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.activity_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.activity_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quiz_submissions quiz_submissions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quiz_submissions quiz_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quizzes quizzes_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reports reports_reported_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_requests schedule_requests_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.schedule_requests
    ADD CONSTRAINT schedule_requests_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_requests schedule_requests_proposer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.schedule_requests
    ADD CONSTRAINT schedule_requests_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_interests user_interests_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_interests user_interests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_languages user_languages_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_languages
    ADD CONSTRAINT user_languages_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_languages user_languages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_languages
    ADD CONSTRAINT user_languages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_saved_words user_saved_words_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_saved_words
    ADD CONSTRAINT user_saved_words_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_saved_words user_saved_words_word_library_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.user_saved_words
    ADD CONSTRAINT user_saved_words_word_library_id_fkey FOREIGN KEY (word_library_id) REFERENCES public.word_library(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vocab_words vocab_words_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.vocab_words
    ADD CONSTRAINT vocab_words_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: word_library word_library_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: stududu
--

ALTER TABLE ONLY public.word_library
    ADD CONSTRAINT word_library_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

-- \unrestrict lXur0id3PQaS9Gp8hkyfSMHrDpjkQ119hEA7Obv5eoD9a10ryBytNmI3tdiXp0m

