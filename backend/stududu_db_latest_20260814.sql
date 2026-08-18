--
-- PostgreSQL database dump
--

\restrict PFD98otrLJWhj7gsvAWXwydM2I2hUxqh7yJv2fUiqqi3JdVex8pkueh02mQ6fkP

-- Dumped from database version 18.4 (c9a59a4)
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

--
-- Name: stududu; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA stududu;


ALTER SCHEMA stududu OWNER TO neondb_owner;

--
-- Name: ActivityPostType; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."ActivityPostType" AS ENUM (
    'word_public',
    'chat_hours_milestone',
    'user_post'
);


ALTER TYPE stududu."ActivityPostType" OWNER TO neondb_owner;

--
-- Name: CallKind; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."CallKind" AS ENUM (
    'audio',
    'video'
);


ALTER TYPE stududu."CallKind" OWNER TO neondb_owner;

--
-- Name: CallStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."CallStatus" AS ENUM (
    'ringing',
    'connected',
    'ended',
    'rejected',
    'missed',
    'failed',
    'unavailable',
    'busy'
);


ALTER TYPE stududu."CallStatus" OWNER TO neondb_owner;

--
-- Name: EndorsementLabel; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."EndorsementLabel" AS ENUM (
    'lang_proficiency',
    'social_knowledge',
    'niche_expertise',
    'friendliness'
);


ALTER TYPE stududu."EndorsementLabel" OWNER TO neondb_owner;

--
-- Name: GroupJoinRequestStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."GroupJoinRequestStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE stududu."GroupJoinRequestStatus" OWNER TO neondb_owner;

--
-- Name: GroupMemberRole; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."GroupMemberRole" AS ENUM (
    'owner',
    'admin',
    'member'
);


ALTER TYPE stududu."GroupMemberRole" OWNER TO neondb_owner;

--
-- Name: GroupMemberStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."GroupMemberStatus" AS ENUM (
    'active',
    'suspended'
);


ALTER TYPE stududu."GroupMemberStatus" OWNER TO neondb_owner;

--
-- Name: GroupPrivacy; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."GroupPrivacy" AS ENUM (
    'public',
    'private'
);


ALTER TYPE stududu."GroupPrivacy" OWNER TO neondb_owner;

--
-- Name: InteractionAction; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."InteractionAction" AS ENUM (
    'like',
    'skip'
);


ALTER TYPE stududu."InteractionAction" OWNER TO neondb_owner;

--
-- Name: LanguageRole; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."LanguageRole" AS ENUM (
    'native',
    'fluent',
    'learning'
);


ALTER TYPE stududu."LanguageRole" OWNER TO neondb_owner;

--
-- Name: MatchStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."MatchStatus" AS ENUM (
    'liked',
    'mutual',
    'skipped',
    'expired'
);


ALTER TYPE stududu."MatchStatus" OWNER TO neondb_owner;

--
-- Name: MessageType; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."MessageType" AS ENUM (
    'text',
    'image',
    'schedule',
    'call'
);


ALTER TYPE stududu."MessageType" OWNER TO neondb_owner;

--
-- Name: ModerationActionType; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."ModerationActionType" AS ENUM (
    'warn',
    'suspend_3d',
    'suspend_1w',
    'hard_delete'
);


ALTER TYPE stududu."ModerationActionType" OWNER TO neondb_owner;

--
-- Name: QuestionSource; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."QuestionSource" AS ENUM (
    'manual',
    'ai_generated'
);


ALTER TYPE stududu."QuestionSource" OWNER TO neondb_owner;

--
-- Name: QuestionStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."QuestionStatus" AS ENUM (
    'active',
    'retired'
);


ALTER TYPE stududu."QuestionStatus" OWNER TO neondb_owner;

--
-- Name: QuestionType; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."QuestionType" AS ENUM (
    'vocabulary',
    'grammar',
    'cloze',
    'reading'
);


ALTER TYPE stududu."QuestionType" OWNER TO neondb_owner;

--
-- Name: ReportStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."ReportStatus" AS ENUM (
    'open',
    'reviewed',
    'dismissed'
);


ALTER TYPE stududu."ReportStatus" OWNER TO neondb_owner;

--
-- Name: SavedWordSource; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."SavedWordSource" AS ENUM (
    'chat',
    'manual'
);


ALTER TYPE stududu."SavedWordSource" OWNER TO neondb_owner;

--
-- Name: ScheduleStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."ScheduleStatus" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);


ALTER TYPE stududu."ScheduleStatus" OWNER TO neondb_owner;

--
-- Name: SetStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."SetStatus" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE stududu."SetStatus" OWNER TO neondb_owner;

--
-- Name: UserRole; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."UserRole" AS ENUM (
    'member',
    'admin'
);


ALTER TYPE stududu."UserRole" OWNER TO neondb_owner;

--
-- Name: UserStatus; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."UserStatus" AS ENUM (
    'active',
    'suspended',
    'deleted'
);


ALTER TYPE stududu."UserStatus" OWNER TO neondb_owner;

--
-- Name: VocabLabel; Type: TYPE; Schema: stududu; Owner: neondb_owner
--

CREATE TYPE stududu."VocabLabel" AS ENUM (
    'new',
    'good'
);


ALTER TYPE stududu."VocabLabel" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_posts; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.activity_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type stududu."ActivityPostType" NOT NULL,
    content_ref text,
    content text,
    image_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    group_id integer,
    status text DEFAULT 'approved'::text NOT NULL
);


ALTER TABLE stududu.activity_posts OWNER TO neondb_owner;

--
-- Name: activity_posts_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.activity_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.activity_posts_id_seq OWNER TO neondb_owner;

--
-- Name: activity_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.activity_posts_id_seq OWNED BY stududu.activity_posts.id;


--
-- Name: blocks; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.blocks (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.blocks OWNER TO neondb_owner;

--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.blocks_id_seq OWNER TO neondb_owner;

--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.blocks_id_seq OWNED BY stududu.blocks.id;


--
-- Name: call_sessions; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.call_sessions (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    caller_id integer NOT NULL,
    callee_id integer NOT NULL,
    kind stududu."CallKind" DEFAULT 'audio'::stududu."CallKind" NOT NULL,
    status stududu."CallStatus" DEFAULT 'ringing'::stududu."CallStatus" NOT NULL,
    invited_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at timestamp(3) without time zone,
    ended_at timestamp(3) without time zone,
    duration_sec integer DEFAULT 0 NOT NULL,
    end_reason text
);


ALTER TABLE stududu.call_sessions OWNER TO neondb_owner;

--
-- Name: call_sessions_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.call_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.call_sessions_id_seq OWNER TO neondb_owner;

--
-- Name: call_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.call_sessions_id_seq OWNED BY stududu.call_sessions.id;


--
-- Name: comment_likes; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.comment_likes (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.comment_likes OWNER TO neondb_owner;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.comment_likes_id_seq OWNER TO neondb_owner;

--
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.comment_likes_id_seq OWNED BY stududu.comment_likes.id;


--
-- Name: community_challenges; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.community_challenges (
    id integer NOT NULL,
    set_id integer NOT NULL,
    title text NOT NULL,
    description text,
    starts_at timestamp(3) without time zone NOT NULL,
    ends_at timestamp(3) without time zone NOT NULL,
    created_by_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.community_challenges OWNER TO neondb_owner;

--
-- Name: community_challenges_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.community_challenges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.community_challenges_id_seq OWNER TO neondb_owner;

--
-- Name: community_challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.community_challenges_id_seq OWNED BY stududu.community_challenges.id;


--
-- Name: conversations; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.conversations (
    id integer NOT NULL,
    match_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.conversations OWNER TO neondb_owner;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.conversations_id_seq OWNER TO neondb_owner;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.conversations_id_seq OWNED BY stududu.conversations.id;


--
-- Name: endorsements; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.endorsements (
    id integer NOT NULL,
    giver_id integer NOT NULL,
    receiver_id integer NOT NULL,
    label stududu."EndorsementLabel" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.endorsements OWNER TO neondb_owner;

--
-- Name: endorsements_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.endorsements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.endorsements_id_seq OWNER TO neondb_owner;

--
-- Name: endorsements_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.endorsements_id_seq OWNED BY stududu.endorsements.id;


--
-- Name: group_join_requests; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.group_join_requests (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    status stududu."GroupJoinRequestStatus" DEFAULT 'pending'::stududu."GroupJoinRequestStatus" NOT NULL,
    message character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp(3) without time zone,
    reviewer_id integer
);


ALTER TABLE stududu.group_join_requests OWNER TO neondb_owner;

--
-- Name: group_join_requests_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.group_join_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.group_join_requests_id_seq OWNER TO neondb_owner;

--
-- Name: group_join_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.group_join_requests_id_seq OWNED BY stududu.group_join_requests.id;


--
-- Name: group_members; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role stududu."GroupMemberRole" DEFAULT 'member'::stududu."GroupMemberRole" NOT NULL,
    status stududu."GroupMemberStatus" DEFAULT 'active'::stududu."GroupMemberStatus" NOT NULL,
    banned_until timestamp(3) without time zone,
    muted_until timestamp(3) without time zone,
    is_pre_approved boolean DEFAULT false NOT NULL,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.group_members OWNER TO neondb_owner;

--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.group_members_id_seq OWNER TO neondb_owner;

--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.group_members_id_seq OWNED BY stududu.group_members.id;


--
-- Name: groups; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    description text,
    avatar_url text,
    cover_url text,
    privacy stududu."GroupPrivacy" DEFAULT 'public'::stududu."GroupPrivacy" NOT NULL,
    post_approval_required boolean DEFAULT false NOT NULL,
    creator_id integer NOT NULL,
    language_id integer,
    topic_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE stududu.groups OWNER TO neondb_owner;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.groups_id_seq OWNER TO neondb_owner;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.groups_id_seq OWNED BY stududu.groups.id;


--
-- Name: interactions; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.interactions (
    id integer NOT NULL,
    match_id integer NOT NULL,
    user_id integer NOT NULL,
    action stududu."InteractionAction" NOT NULL,
    hidden_until timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.interactions OWNER TO neondb_owner;

--
-- Name: interactions_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.interactions_id_seq OWNER TO neondb_owner;

--
-- Name: interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.interactions_id_seq OWNED BY stududu.interactions.id;


--
-- Name: languages; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.languages (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    framework text,
    hidden boolean DEFAULT false NOT NULL
);


ALTER TABLE stududu.languages OWNER TO neondb_owner;

--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.languages_id_seq OWNER TO neondb_owner;

--
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.languages_id_seq OWNED BY stududu.languages.id;


--
-- Name: match_preferences; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.match_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    intent text,
    language_focus text,
    level_desired text
);


ALTER TABLE stududu.match_preferences OWNER TO neondb_owner;

--
-- Name: match_preferences_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.match_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.match_preferences_id_seq OWNER TO neondb_owner;

--
-- Name: match_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.match_preferences_id_seq OWNED BY stududu.match_preferences.id;


--
-- Name: match_scores; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.match_scores (
    id integer NOT NULL,
    match_id integer NOT NULL,
    lang_complement boolean NOT NULL,
    shared_topic_count integer DEFAULT 0 NOT NULL,
    intent_alignment boolean DEFAULT false NOT NULL,
    total double precision DEFAULT 0 NOT NULL
);


ALTER TABLE stududu.match_scores OWNER TO neondb_owner;

--
-- Name: match_scores_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.match_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.match_scores_id_seq OWNER TO neondb_owner;

--
-- Name: match_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.match_scores_id_seq OWNED BY stududu.match_scores.id;


--
-- Name: matches; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.matches (
    id integer NOT NULL,
    member_id integer NOT NULL,
    candidate_id integer NOT NULL,
    status stududu."MatchStatus" DEFAULT 'liked'::stududu."MatchStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone
);


ALTER TABLE stududu.matches OWNER TO neondb_owner;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.matches_id_seq OWNER TO neondb_owner;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.matches_id_seq OWNED BY stududu.matches.id;


--
-- Name: messages; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    type stududu."MessageType" DEFAULT 'text'::stududu."MessageType" NOT NULL,
    content text NOT NULL,
    payload jsonb,
    reactions jsonb,
    sent_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at timestamp(3) without time zone
);


ALTER TABLE stududu.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.messages_id_seq OWNED BY stududu.messages.id;


--
-- Name: moderation_actions; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.moderation_actions (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    target_user_id integer NOT NULL,
    action stududu."ModerationActionType" NOT NULL,
    reason text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.moderation_actions OWNER TO neondb_owner;

--
-- Name: moderation_actions_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.moderation_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.moderation_actions_id_seq OWNER TO neondb_owner;

--
-- Name: moderation_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.moderation_actions_id_seq OWNED BY stududu.moderation_actions.id;


--
-- Name: notifications; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    sender_id integer,
    type text NOT NULL,
    message text NOT NULL,
    reference_id integer,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.notifications_id_seq OWNED BY stududu.notifications.id;


--
-- Name: post_comments; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.post_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    parent_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.post_comments OWNER TO neondb_owner;

--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.post_comments_id_seq OWNER TO neondb_owner;

--
-- Name: post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.post_comments_id_seq OWNED BY stududu.post_comments.id;


--
-- Name: post_likes; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.post_likes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.post_likes OWNER TO neondb_owner;

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.post_likes_id_seq OWNER TO neondb_owner;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.post_likes_id_seq OWNED BY stududu.post_likes.id;


--
-- Name: question_sets; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.question_sets (
    id integer NOT NULL,
    language_id integer NOT NULL,
    topic_id integer NOT NULL,
    framework text NOT NULL,
    level text NOT NULL,
    level_order integer NOT NULL,
    title text NOT NULL,
    description text,
    content_language text DEFAULT 'vi'::text NOT NULL,
    status stududu."SetStatus" DEFAULT 'draft'::stududu."SetStatus" NOT NULL,
    question_count integer DEFAULT 0 NOT NULL,
    created_by_id integer NOT NULL,
    updated_by_id integer,
    published_at timestamp(3) without time zone,
    last_generated_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    ends_at timestamp(3) without time zone,
    max_attempts integer,
    starts_at timestamp(3) without time zone,
    time_per_question_sec integer DEFAULT 15 NOT NULL
);


ALTER TABLE stududu.question_sets OWNER TO neondb_owner;

--
-- Name: question_sets_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.question_sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.question_sets_id_seq OWNER TO neondb_owner;

--
-- Name: question_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.question_sets_id_seq OWNED BY stududu.question_sets.id;


--
-- Name: reports; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.reports (
    id integer NOT NULL,
    reporter_id integer NOT NULL,
    reported_id integer NOT NULL,
    reason text NOT NULL,
    target_type text,
    target_id integer,
    status stududu."ReportStatus" DEFAULT 'open'::stududu."ReportStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.reports OWNER TO neondb_owner;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.reports_id_seq OWNER TO neondb_owner;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.reports_id_seq OWNED BY stududu.reports.id;


--
-- Name: schedule_requests; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.schedule_requests (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    proposer_id integer NOT NULL,
    proposed_time_utc timestamp(3) without time zone NOT NULL,
    status stududu."ScheduleStatus" DEFAULT 'pending'::stududu."ScheduleStatus" NOT NULL,
    reminder_sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.schedule_requests OWNER TO neondb_owner;

--
-- Name: schedule_requests_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.schedule_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.schedule_requests_id_seq OWNER TO neondb_owner;

--
-- Name: schedule_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.schedule_requests_id_seq OWNED BY stududu.schedule_requests.id;


--
-- Name: test_answers; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.test_answers (
    id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    chosen_index integer,
    is_correct boolean NOT NULL
);


ALTER TABLE stududu.test_answers OWNER TO neondb_owner;

--
-- Name: test_answers_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.test_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.test_answers_id_seq OWNER TO neondb_owner;

--
-- Name: test_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.test_answers_id_seq OWNED BY stududu.test_answers.id;


--
-- Name: test_attempts; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.test_attempts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    set_id integer NOT NULL,
    challenge_id integer,
    total_count integer DEFAULT 20 NOT NULL,
    correct_count integer DEFAULT 0 NOT NULL,
    question_order integer[] DEFAULT ARRAY[]::integer[],
    option_order jsonb,
    started_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    finished_at timestamp(3) without time zone,
    score integer DEFAULT 0 NOT NULL
);


ALTER TABLE stududu.test_attempts OWNER TO neondb_owner;

--
-- Name: test_attempts_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.test_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.test_attempts_id_seq OWNER TO neondb_owner;

--
-- Name: test_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.test_attempts_id_seq OWNED BY stududu.test_attempts.id;


--
-- Name: test_questions; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.test_questions (
    id integer NOT NULL,
    set_id integer NOT NULL,
    order_index integer NOT NULL,
    type stududu."QuestionType" NOT NULL,
    term text,
    passage text,
    prompt text NOT NULL,
    options text[],
    answer_index integer NOT NULL,
    explanation text,
    status stududu."QuestionStatus" DEFAULT 'active'::stududu."QuestionStatus" NOT NULL,
    source stududu."QuestionSource" DEFAULT 'manual'::stududu."QuestionSource" NOT NULL,
    source_meta jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.test_questions OWNER TO neondb_owner;

--
-- Name: test_questions_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.test_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.test_questions_id_seq OWNER TO neondb_owner;

--
-- Name: test_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.test_questions_id_seq OWNED BY stududu.test_questions.id;


--
-- Name: topics; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.topics (
    id integer NOT NULL,
    name text NOT NULL,
    hidden boolean DEFAULT false NOT NULL
);


ALTER TABLE stududu.topics OWNER TO neondb_owner;

--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.topics_id_seq OWNER TO neondb_owner;

--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.topics_id_seq OWNED BY stududu.topics.id;


--
-- Name: user_interests; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.user_interests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    topic_id integer NOT NULL
);


ALTER TABLE stududu.user_interests OWNER TO neondb_owner;

--
-- Name: user_interests_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.user_interests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.user_interests_id_seq OWNER TO neondb_owner;

--
-- Name: user_interests_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.user_interests_id_seq OWNED BY stududu.user_interests.id;


--
-- Name: user_languages; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.user_languages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    language_id integer NOT NULL,
    role stududu."LanguageRole" NOT NULL,
    level text
);


ALTER TABLE stududu.user_languages OWNER TO neondb_owner;

--
-- Name: user_languages_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.user_languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.user_languages_id_seq OWNER TO neondb_owner;

--
-- Name: user_languages_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.user_languages_id_seq OWNED BY stududu.user_languages.id;


--
-- Name: user_saved_words; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.user_saved_words (
    id integer NOT NULL,
    user_id integer NOT NULL,
    word_library_id integer NOT NULL,
    personal_note text,
    source stududu."SavedWordSource" NOT NULL,
    status text DEFAULT 'learning'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.user_saved_words OWNER TO neondb_owner;

--
-- Name: user_saved_words_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.user_saved_words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.user_saved_words_id_seq OWNER TO neondb_owner;

--
-- Name: user_saved_words_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.user_saved_words_id_seq OWNED BY stududu.user_saved_words.id;


--
-- Name: users; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text,
    google_id text,
    display_name text NOT NULL,
    avatar_url text,
    bio text,
    intent text,
    gender text,
    dob timestamp(3) without time zone,
    city text,
    country text,
    role stududu."UserRole" DEFAULT 'member'::stududu."UserRole" NOT NULL,
    status stududu."UserStatus" DEFAULT 'active'::stududu."UserStatus" NOT NULL,
    suspended_until timestamp(3) without time zone,
    last_active timestamp(3) without time zone,
    timezone text DEFAULT 'VN'::text,
    available_slots text[] DEFAULT ARRAY[]::text[],
    share_activity boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.users_id_seq OWNED BY stududu.users.id;


--
-- Name: vocab_topics; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.vocab_topics (
    id integer NOT NULL,
    name text NOT NULL,
    hidden boolean DEFAULT false NOT NULL
);


ALTER TABLE stududu.vocab_topics OWNER TO neondb_owner;

--
-- Name: vocab_topics_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.vocab_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.vocab_topics_id_seq OWNER TO neondb_owner;

--
-- Name: vocab_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.vocab_topics_id_seq OWNED BY stududu.vocab_topics.id;


--
-- Name: vocab_words; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.vocab_words (
    id integer NOT NULL,
    user_id integer NOT NULL,
    word text NOT NULL,
    translation text NOT NULL,
    language text NOT NULL,
    flag text,
    label stududu."VocabLabel" DEFAULT 'new'::stududu."VocabLabel" NOT NULL,
    note text,
    from_partner text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.vocab_words OWNER TO neondb_owner;

--
-- Name: vocab_words_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.vocab_words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.vocab_words_id_seq OWNER TO neondb_owner;

--
-- Name: vocab_words_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.vocab_words_id_seq OWNED BY stududu.vocab_words.id;


--
-- Name: word_library; Type: TABLE; Schema: stududu; Owner: neondb_owner
--

CREATE TABLE stududu.word_library (
    id integer NOT NULL,
    term character varying(100) NOT NULL,
    language_id integer NOT NULL,
    phonetic text,
    part_of_speech text,
    definition text,
    example text,
    audio_url text,
    save_count integer DEFAULT 0 NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    updated_by_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE stududu.word_library OWNER TO neondb_owner;

--
-- Name: word_library_id_seq; Type: SEQUENCE; Schema: stududu; Owner: neondb_owner
--

CREATE SEQUENCE stududu.word_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE stududu.word_library_id_seq OWNER TO neondb_owner;

--
-- Name: word_library_id_seq; Type: SEQUENCE OWNED BY; Schema: stududu; Owner: neondb_owner
--

ALTER SEQUENCE stududu.word_library_id_seq OWNED BY stududu.word_library.id;


--
-- Name: activity_posts id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.activity_posts ALTER COLUMN id SET DEFAULT nextval('stududu.activity_posts_id_seq'::regclass);


--
-- Name: blocks id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.blocks ALTER COLUMN id SET DEFAULT nextval('stududu.blocks_id_seq'::regclass);


--
-- Name: call_sessions id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.call_sessions ALTER COLUMN id SET DEFAULT nextval('stududu.call_sessions_id_seq'::regclass);


--
-- Name: comment_likes id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.comment_likes ALTER COLUMN id SET DEFAULT nextval('stududu.comment_likes_id_seq'::regclass);


--
-- Name: community_challenges id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.community_challenges ALTER COLUMN id SET DEFAULT nextval('stududu.community_challenges_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.conversations ALTER COLUMN id SET DEFAULT nextval('stududu.conversations_id_seq'::regclass);


--
-- Name: endorsements id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.endorsements ALTER COLUMN id SET DEFAULT nextval('stududu.endorsements_id_seq'::regclass);


--
-- Name: group_join_requests id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_join_requests ALTER COLUMN id SET DEFAULT nextval('stududu.group_join_requests_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_members ALTER COLUMN id SET DEFAULT nextval('stududu.group_members_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.groups ALTER COLUMN id SET DEFAULT nextval('stududu.groups_id_seq'::regclass);


--
-- Name: interactions id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.interactions ALTER COLUMN id SET DEFAULT nextval('stududu.interactions_id_seq'::regclass);


--
-- Name: languages id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.languages ALTER COLUMN id SET DEFAULT nextval('stududu.languages_id_seq'::regclass);


--
-- Name: match_preferences id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.match_preferences ALTER COLUMN id SET DEFAULT nextval('stududu.match_preferences_id_seq'::regclass);


--
-- Name: match_scores id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.match_scores ALTER COLUMN id SET DEFAULT nextval('stududu.match_scores_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.matches ALTER COLUMN id SET DEFAULT nextval('stududu.matches_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.messages ALTER COLUMN id SET DEFAULT nextval('stududu.messages_id_seq'::regclass);


--
-- Name: moderation_actions id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.moderation_actions ALTER COLUMN id SET DEFAULT nextval('stududu.moderation_actions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.notifications ALTER COLUMN id SET DEFAULT nextval('stududu.notifications_id_seq'::regclass);


--
-- Name: post_comments id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_comments ALTER COLUMN id SET DEFAULT nextval('stududu.post_comments_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_likes ALTER COLUMN id SET DEFAULT nextval('stududu.post_likes_id_seq'::regclass);


--
-- Name: question_sets id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.question_sets ALTER COLUMN id SET DEFAULT nextval('stududu.question_sets_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.reports ALTER COLUMN id SET DEFAULT nextval('stududu.reports_id_seq'::regclass);


--
-- Name: schedule_requests id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.schedule_requests ALTER COLUMN id SET DEFAULT nextval('stududu.schedule_requests_id_seq'::regclass);


--
-- Name: test_answers id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_answers ALTER COLUMN id SET DEFAULT nextval('stududu.test_answers_id_seq'::regclass);


--
-- Name: test_attempts id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_attempts ALTER COLUMN id SET DEFAULT nextval('stududu.test_attempts_id_seq'::regclass);


--
-- Name: test_questions id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_questions ALTER COLUMN id SET DEFAULT nextval('stududu.test_questions_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.topics ALTER COLUMN id SET DEFAULT nextval('stududu.topics_id_seq'::regclass);


--
-- Name: user_interests id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_interests ALTER COLUMN id SET DEFAULT nextval('stududu.user_interests_id_seq'::regclass);


--
-- Name: user_languages id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_languages ALTER COLUMN id SET DEFAULT nextval('stududu.user_languages_id_seq'::regclass);


--
-- Name: user_saved_words id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_saved_words ALTER COLUMN id SET DEFAULT nextval('stududu.user_saved_words_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.users ALTER COLUMN id SET DEFAULT nextval('stududu.users_id_seq'::regclass);


--
-- Name: vocab_topics id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.vocab_topics ALTER COLUMN id SET DEFAULT nextval('stududu.vocab_topics_id_seq'::regclass);


--
-- Name: vocab_words id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.vocab_words ALTER COLUMN id SET DEFAULT nextval('stududu.vocab_words_id_seq'::regclass);


--
-- Name: word_library id; Type: DEFAULT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.word_library ALTER COLUMN id SET DEFAULT nextval('stududu.word_library_id_seq'::regclass);


--
-- Data for Name: activity_posts; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.activity_posts (id, user_id, type, content_ref, content, image_url, created_at, group_id, status) FROM stdin;
1	6	user_post	\N	Hi everyone! Ready to exchange EN and VI! Feel free to connect.	\N	2026-08-06 02:53:12.903	\N	approved
2	7	user_post	\N	Hi everyone! Ready to exchange JA and EN! Feel free to connect.	\N	2026-08-06 02:53:13.804	\N	approved
3	8	user_post	\N	Hi everyone! Ready to exchange ZH and VI! Feel free to connect.	\N	2026-08-06 02:53:14.627	\N	approved
4	9	user_post	\N	Hi everyone! Ready to exchange KO and EN! Feel free to connect.	\N	2026-08-06 02:53:15.463	\N	approved
5	10	user_post	\N	Hi everyone! Ready to exchange FR and VI! Feel free to connect.	\N	2026-08-06 02:53:16.377	\N	approved
6	11	user_post	\N	Hi everyone! Ready to exchange EN and VI! Feel free to connect.	\N	2026-08-06 02:53:17.243	\N	approved
7	3	user_post	\N	Xin chào mọi người! Mình là Bé Khót. Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:37.922	\N	approved
8	20	user_post	\N	Xin chào mọi người! Mình là Thành Viên 1 (Member 1). Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:43.634	\N	approved
9	21	user_post	\N	Xin chào mọi người! Mình là Thành Viên 2 (Member 2). Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:44.371	\N	approved
10	22	user_post	\N	Xin chào mọi người! Mình là User 1 (Nguyễn Văn A). Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:45.243	\N	approved
11	23	user_post	\N	Xin chào mọi người! Mình là User 2 (Trần Thị B). Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:46.021	\N	approved
12	24	user_post	\N	Xin chào mọi người! Mình là User 3 (Lê Hoàng C). Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:46.811	\N	approved
13	25	user_post	\N	Xin chào mọi người! Mình là John Smith. Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:47.578	\N	approved
14	26	user_post	\N	Xin chào mọi người! Mình là Jessica Taylor. Rất vui được gặp và học cùng các bạn trên Stududu!	\N	2026-08-06 02:59:48.429	\N	approved
15	3	user_post	\N	hello	\N	2026-08-06 03:07:34.347	\N	approved
\.


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.blocks (id, blocker_id, blocked_id, created_at) FROM stdin;
\.


--
-- Data for Name: call_sessions; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.call_sessions (id, conversation_id, caller_id, callee_id, kind, status, invited_at, started_at, ended_at, duration_sec, end_reason) FROM stdin;
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.comment_likes (id, comment_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: community_challenges; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.community_challenges (id, set_id, title, description, starts_at, ends_at, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.conversations (id, match_id, created_at) FROM stdin;
1	1	2026-08-06 02:59:48.811
2	2	2026-08-06 02:59:49.252
3	3	2026-08-06 02:59:49.584
4	4	2026-08-06 02:59:49.932
5	5	2026-08-06 02:59:50.265
\.


--
-- Data for Name: endorsements; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.endorsements (id, giver_id, receiver_id, label, created_at) FROM stdin;
\.


--
-- Data for Name: group_join_requests; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.group_join_requests (id, group_id, user_id, status, message, created_at, reviewed_at, reviewer_id) FROM stdin;
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.group_members (id, group_id, user_id, role, status, banned_until, muted_until, is_pre_approved, joined_at) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.groups (id, name, slug, description, avatar_url, cover_url, privacy, post_approval_required, creator_id, language_id, topic_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: interactions; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.interactions (id, match_id, user_id, action, hidden_until, created_at) FROM stdin;
\.


--
-- Data for Name: languages; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.languages (id, code, name, framework, hidden) FROM stdin;
1	vi	Tiếng Việt	CEFR	f
2	en	English	CEFR	f
3	zh	中文	CEFR	f
4	ja	日本語	CEFR	f
5	ko	한국어	CEFR	f
6	fr	Français	CEFR	f
7	es	Español	CEFR	f
8	de	Deutsch	CEFR	f
\.


--
-- Data for Name: match_preferences; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.match_preferences (id, user_id, intent, language_focus, level_desired) FROM stdin;
1	27	Giao tiếp casual	\N	\N
2	28	Giao tiếp casual	\N	\N
3	29	Giao tiếp casual	\N	\N
\.


--
-- Data for Name: match_scores; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.match_scores (id, match_id, lang_complement, shared_topic_count, intent_alignment, total) FROM stdin;
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.matches (id, member_id, candidate_id, status, created_at, expires_at) FROM stdin;
1	3	6	mutual	2026-08-06 02:59:48.603	\N
2	3	11	mutual	2026-08-06 02:59:49.149	\N
3	3	8	mutual	2026-08-06 02:59:49.478	\N
4	3	7	mutual	2026-08-06 02:59:49.825	\N
5	3	10	mutual	2026-08-06 02:59:50.163	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.messages (id, conversation_id, sender_id, type, content, payload, reactions, sent_at, read_at) FROM stdin;
9	5	10	text	Bonjour Bé Khót! How is your day going?	\N	\N	2026-08-06 02:59:50.316	2026-08-06 03:05:52.932
7	4	7	text	Konnichiwa! Glad to connect with you.	\N	\N	2026-08-06 02:59:50	2026-08-06 03:05:54.673
8	4	7	text	I am learning English too!	\N	\N	2026-08-06 02:59:50.054	2026-08-06 03:05:54.673
5	3	8	text	你好! Hello from Beijing!	\N	\N	2026-08-06 02:59:49.639	2026-08-06 03:05:56.166
6	3	8	text	Let us exchange Vietnamese and Mandarin.	\N	\N	2026-08-06 02:59:49.713	2026-08-06 03:05:56.166
3	2	11	text	Chào bạn! Mình có thể giúp bạn luyện Tiếng Anh giao tiếp nhé.	\N	\N	2026-08-06 02:59:49.316	2026-08-06 03:05:57.355
4	2	11	text	Bạn rảnh khi nào?	\N	\N	2026-08-06 02:59:49.367	2026-08-06 03:05:57.355
1	1	6	text	Hi Bé Khót! How are you today?	\N	\N	2026-08-06 02:59:48.922	2026-08-06 03:05:58.597
2	1	6	text	Nice to meet you! Are you free for language practice?	\N	\N	2026-08-06 02:59:49.033	2026-08-06 03:05:58.597
\.


--
-- Data for Name: moderation_actions; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.moderation_actions (id, admin_id, target_user_id, action, reason, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.notifications (id, user_id, sender_id, type, message, reference_id, read, created_at) FROM stdin;
1	28	29	pending_join_request	[Yêu cầu gia nhập] Duy Dang Thai muốn gia nhập nhóm "Chinese Speaking".	1	t	2026-08-06 03:31:03.51
2	29	28	group_join_approved	Yêu cầu tham gia nhóm "Chinese Speaking" của bạn đã được phê duyệt!	1	f	2026-08-06 03:31:25.258
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.post_comments (id, post_id, user_id, content, parent_id, created_at) FROM stdin;
1	11	3	mmm	\N	2026-08-06 03:31:59.975
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.post_likes (id, post_id, user_id, created_at) FROM stdin;
1	11	3	2026-08-06 03:31:56.807
\.


--
-- Data for Name: question_sets; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.question_sets (id, language_id, topic_id, framework, level, level_order, title, description, content_language, status, question_count, created_by_id, updated_by_id, published_at, last_generated_at, created_at, updated_at, ends_at, max_attempts, starts_at, time_per_question_sec) FROM stdin;
1	2	7	CEFR	A1	1	Thời tiết — A1	dsfacewfv	vi	published	20	1	1	2026-08-13 07:40:12.934	\N	2026-08-13 07:31:57.817	2026-08-13 07:40:12.935	2026-08-31 16:59:59.999	\N	2026-08-12 17:00:00	15
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.reports (id, reporter_id, reported_id, reason, target_type, target_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: schedule_requests; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.schedule_requests (id, conversation_id, proposer_id, proposed_time_utc, status, reminder_sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: test_answers; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.test_answers (id, attempt_id, question_id, chosen_index, is_correct) FROM stdin;
1	2	7	0	t
2	2	2	1	f
3	2	6	2	f
4	2	12	3	f
5	2	8	2	f
6	2	3	2	f
7	2	10	2	f
8	2	18	2	f
9	2	11	1	f
10	2	20	0	t
11	2	17	1	f
12	2	9	3	f
13	2	13	2	f
14	2	19	3	f
15	2	5	0	t
16	2	14	3	f
17	2	4	1	f
18	2	1	1	f
19	2	15	3	f
20	2	16	3	f
21	3	4	3	f
22	3	1	3	f
23	3	8	0	t
24	3	13	0	t
25	3	11	3	f
26	3	2	0	t
27	3	14	0	t
28	3	20	1	f
29	3	16	0	t
30	3	7	0	t
31	3	10	3	f
32	3	18	2	f
33	3	3	1	f
34	3	9	3	f
35	3	17	0	t
36	3	6	1	f
37	3	19	0	t
38	3	12	2	f
39	3	5	0	t
40	3	15	0	t
41	4	12	0	t
42	4	16	1	f
43	4	17	3	f
44	4	1	1	f
45	4	4	3	f
46	4	5	2	f
47	4	8	2	f
48	4	14	0	t
49	4	13	2	f
50	4	20	0	t
51	4	6	0	t
52	4	11	3	f
53	4	2	0	t
54	4	7	1	f
55	4	10	3	f
56	4	18	1	f
57	4	15	1	f
58	4	9	3	f
59	4	19	0	t
60	4	3	1	f
61	5	19	0	t
62	5	8	1	f
63	5	7	0	t
64	5	14	0	t
65	5	16	0	t
66	5	1	2	f
67	5	11	3	f
68	5	13	0	t
69	5	9	0	t
70	5	17	0	t
71	5	3	0	t
72	5	18	2	f
73	5	15	3	f
74	5	5	0	t
75	5	6	1	f
76	5	10	0	t
77	5	4	0	t
78	5	12	0	t
79	5	20	2	f
80	5	2	1	f
81	6	12	0	t
82	6	2	0	t
83	6	17	0	t
84	6	14	0	t
85	6	11	2	f
86	6	3	0	t
87	6	16	2	f
88	6	5	0	t
89	6	13	0	t
90	6	19	0	t
91	6	4	0	t
92	6	20	0	t
93	6	7	0	t
94	6	1	1	f
95	6	9	0	t
96	6	10	0	t
97	6	15	0	t
98	6	6	2	f
99	6	18	0	t
100	6	8	0	t
\.


--
-- Data for Name: test_attempts; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.test_attempts (id, user_id, set_id, challenge_id, total_count, correct_count, question_order, option_order, started_at, finished_at, score) FROM stdin;
1	1	1	\N	20	0	{1,10,17,3,19,20,12,9,15,2,11,16,7,6,14,8,4,5,18,13}	{"1": [3, 0, 2, 1], "2": [0, 2, 3, 1], "3": [2, 3, 0, 1], "4": [1, 2, 0, 3], "5": [2, 0, 3, 1], "6": [3, 1, 0, 2], "7": [3, 1, 2, 0], "8": [2, 0, 1, 3], "9": [2, 3, 1, 0], "10": [0, 1, 3, 2], "11": [2, 1, 3, 0], "12": [3, 2, 1, 0], "13": [3, 2, 0, 1], "14": [0, 3, 2, 1], "15": [0, 3, 1, 2], "16": [1, 3, 2, 0], "17": [1, 3, 2, 0], "18": [1, 2, 0, 3], "19": [3, 0, 2, 1], "20": [1, 2, 0, 3]}	2026-08-13 07:31:59.883	\N	0
2	1	1	\N	20	3	{7,2,6,12,8,3,10,18,11,20,17,9,13,19,5,14,4,1,15,16}	{"1": [0, 2, 1, 3], "2": [1, 2, 3, 0], "3": [3, 2, 0, 1], "4": [1, 2, 3, 0], "5": [1, 0, 3, 2], "6": [2, 0, 1, 3], "7": [1, 0, 3, 2], "8": [1, 0, 3, 2], "9": [1, 2, 3, 0], "10": [0, 3, 2, 1], "11": [1, 0, 2, 3], "12": [0, 3, 1, 2], "13": [0, 2, 1, 3], "14": [1, 2, 3, 0], "15": [2, 0, 1, 3], "16": [0, 3, 1, 2], "17": [2, 0, 1, 3], "18": [2, 3, 1, 0], "19": [1, 2, 3, 0], "20": [0, 3, 2, 1]}	2026-08-13 07:39:19.022	2026-08-13 07:39:57.949	0
3	28	1	\N	20	10	{4,1,8,13,11,2,14,20,16,7,10,18,3,9,17,6,19,12,5,15}	{"1": [3, 1, 0, 2], "2": [0, 3, 2, 1], "3": [3, 1, 2, 0], "4": [0, 3, 2, 1], "5": [2, 0, 1, 3], "6": [1, 2, 3, 0], "7": [2, 0, 1, 3], "8": [3, 0, 1, 2], "9": [1, 0, 3, 2], "10": [3, 2, 1, 0], "11": [3, 2, 0, 1], "12": [0, 1, 2, 3], "13": [1, 2, 3, 0], "14": [2, 3, 1, 0], "15": [2, 3, 1, 0], "16": [3, 1, 0, 2], "17": [2, 3, 1, 0], "18": [2, 0, 1, 3], "19": [2, 3, 1, 0], "20": [3, 2, 1, 0]}	2026-08-13 07:40:33.16	2026-08-13 07:41:56.814	0
4	28	1	\N	20	6	{12,16,17,1,4,5,8,14,13,20,6,11,2,7,10,18,15,9,19,3}	{"1": [1, 0, 2, 3], "2": [1, 3, 2, 0], "3": [2, 1, 3, 0], "4": [0, 1, 2, 3], "5": [1, 3, 2, 0], "6": [3, 0, 1, 2], "7": [2, 0, 1, 3], "8": [3, 2, 1, 0], "9": [1, 0, 3, 2], "10": [0, 3, 2, 1], "11": [3, 0, 2, 1], "12": [3, 2, 1, 0], "13": [3, 0, 1, 2], "14": [0, 3, 1, 2], "15": [1, 3, 0, 2], "16": [2, 3, 1, 0], "17": [2, 3, 1, 0], "18": [2, 3, 0, 1], "19": [3, 2, 0, 1], "20": [3, 1, 0, 2]}	2026-08-13 07:46:37.508	2026-08-13 07:47:27.101	0
5	28	1	\N	20	12	{19,8,7,14,16,1,11,13,9,17,3,18,15,5,6,10,4,12,20,2}	{"1": [0, 2, 3, 1], "2": [3, 1, 2, 0], "3": [0, 1, 3, 2], "4": [2, 0, 1, 3], "5": [0, 1, 2, 3], "6": [2, 1, 0, 3], "7": [2, 3, 0, 1], "8": [1, 0, 2, 3], "9": [3, 2, 1, 0], "10": [0, 3, 1, 2], "11": [1, 3, 0, 2], "12": [1, 0, 3, 2], "13": [3, 1, 0, 2], "14": [1, 3, 2, 0], "15": [2, 1, 3, 0], "16": [0, 2, 1, 3], "17": [0, 3, 1, 2], "18": [3, 2, 1, 0], "19": [2, 1, 3, 0], "20": [1, 0, 2, 3]}	2026-08-13 08:03:11.755	2026-08-13 08:04:39.991	16900
6	28	1	\N	20	16	{12,2,17,14,11,3,16,5,13,19,4,20,7,1,9,10,15,6,18,8}	{"1": [2, 1, 3, 0], "2": [1, 0, 3, 2], "3": [2, 0, 3, 1], "4": [3, 0, 1, 2], "5": [0, 1, 3, 2], "6": [2, 3, 0, 1], "7": [0, 3, 1, 2], "8": [3, 1, 0, 2], "9": [2, 3, 0, 1], "10": [0, 3, 1, 2], "11": [2, 3, 0, 1], "12": [3, 0, 1, 2], "13": [3, 2, 0, 1], "14": [2, 0, 3, 1], "15": [0, 3, 1, 2], "16": [0, 3, 2, 1], "17": [1, 2, 3, 0], "18": [2, 0, 3, 1], "19": [1, 0, 3, 2], "20": [1, 2, 0, 3]}	2026-08-13 08:05:54.253	2026-08-13 08:07:32.057	22600
\.


--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.test_questions (id, set_id, order_index, type, term, passage, prompt, options, answer_index, explanation, status, source, source_meta, created_at) FROM stdin;
1	1	0	vocabulary	天気	\N	Từ '天気' có nghĩa là gì?	{"Thời tiết","Mùa trong năm","Bầu trời","Nhiệt độ"}	0	Từ vựng "天気" (/てんき (tenki)/) có nghĩa là: Thời tiết. Ví dụ: きょうの てんきは どうですか。	active	manual	null	2026-08-13 07:31:58.689
2	1	1	vocabulary	雨	\N	Từ '雨' có nghĩa là gì?	{"Cơn mưa / Mưa",Nắng,Tuyết,"Sương mù"}	0	Từ vựng "雨" (/あめ (ame)/) có nghĩa là: Cơn mưa / Mưa. Ví dụ: きょうは あめが ふっています。	active	manual	null	2026-08-13 07:31:58.689
3	1	2	vocabulary	晴れ	\N	Từ '晴れ' có nghĩa là gì?	{"Trời nắng / Nắng đẹp","Trời mưa lớn","Trời u ám","Gió bão"}	0	Từ vựng "晴れ" (/はれ (hare)/) có nghĩa là: Trời nắng / Nắng đẹp. Ví dụ: きょうの てんきは はれです。	active	manual	null	2026-08-13 07:31:58.689
4	1	3	vocabulary	雪	\N	Từ '雪' có nghĩa là gì?	{Tuyết,Mây,"Mưa rào","Cầu vồng"}	0	Từ vựng "雪" (/ゆき (yuki)/) có nghĩa là: Tuyết. Ví dụ: ふゆは ゆきが ふります。	active	manual	null	2026-08-13 07:31:58.689
5	1	4	vocabulary	曇り	\N	Từ '曇り' có nghĩa là gì?	{"Trời nhiều mây / U ám","Nắng gắt","Tuyết tan","Sương muối"}	0	Từ vựng "曇り" (/くもり (kumori)/) có nghĩa là: Trời nhiều mây / U ám. Ví dụ: あしたは くもりでしょう。	active	manual	null	2026-08-13 07:31:58.689
6	1	5	vocabulary	風	\N	Từ '風' có nghĩa là gì?	{Gió,"Mưa đá","Nắng hạn","Khói bụi"}	0	Từ vựng "風" (/かぜ (kaze)/) có nghĩa là: Gió. Ví dụ: ごごから かぜが つよくなるでしょう。	active	manual	null	2026-08-13 07:31:58.689
7	1	6	vocabulary	暑い	\N	Từ '暑い' có nghĩa là gì?	{"Nóng (thời tiết)","Lạnh giá","Mát mẻ","Ấm áp"}	0	Từ vựng "暑い" (/あつい (atsui)/) có nghĩa là: Nóng (thời tiết). Ví dụ: なつは とても あついです。	active	manual	null	2026-08-13 07:31:58.689
8	1	7	vocabulary	寒い	\N	Từ '寒い' có nghĩa là gì?	{"Lạnh (thời tiết)","Nóng bức","Oi nồng","Ấm áp"}	0	Từ vựng "寒い" (/さむい (samui)/) có nghĩa là: Lạnh (thời tiết). Ví dụ: ふゆは さむいですから、コートを きましょう。	active	manual	null	2026-08-13 07:31:58.689
9	1	8	vocabulary	暖かい	\N	Từ '暖かい' có nghĩa là gì?	{"Ấm áp (thời tiết)","Giá lạnh","Nóng nực","Mát rượi"}	0	Từ vựng "暖かい" (/あたたかい (atatakai)/) có nghĩa là: Ấm áp (thời tiết). Ví dụ: はるは あたたかくて きもちがいいです。	active	manual	null	2026-08-13 07:31:58.689
10	1	9	vocabulary	涼しい	\N	Từ '涼しい' có nghĩa là gì?	{"Mát mẻ (thời tiết)","Nóng bức","Băng giá","Hầm hập"}	0	Từ vựng "涼しい" (/すずしい (suzushii)/) có nghĩa là: Mát mẻ (thời tiết). Ví dụ: あきは すずしくて さんぽに いきます。	active	manual	null	2026-08-13 07:31:58.689
11	1	10	vocabulary	太陽	\N	Từ '太陽' có nghĩa là gì?	{"Mặt trời","Mặt trăng","Ngôi sao","Đám mây"}	0	Từ vựng "太陽" (/たいよう (taiyou)/) có nghĩa là: Mặt trời. Ví dụ: あさから たいようが でています。	active	manual	null	2026-08-13 07:31:58.689
12	1	11	vocabulary	空	\N	Từ '空' có nghĩa là gì?	{"Bầu trời","Mặt đất","Biển cả","Ngọn núi"}	0	Từ vựng "空" (/そら (sora)/) có nghĩa là: Bầu trời. Ví dụ: そらが くらいですから あめが ふるかもしれません。	active	manual	null	2026-08-13 07:31:58.689
13	1	12	vocabulary	洗濯	\N	Từ '洗濯' có nghĩa là gì?	{"Giặt giũ / Giặt quần áo","Nấu ăn","Rửa bát","Dọn dẹp nhà"}	0	Từ vựng "洗濯" (/せんたく (sentaku)/) có nghĩa là: Giặt giũ / Giặt quần áo. Ví dụ: きょうの うちに せんたくを します。	active	manual	null	2026-08-13 07:31:58.689
14	1	13	vocabulary	季節	\N	Từ '季節' có nghĩa là gì?	{"Mùa / Thời tiết theo mùa","Thời gian","Ngày tháng","Thế kỷ"}	0	Từ vựng "季節" (/きせつ (kisetsu)/) có nghĩa là: Mùa / Thời tiết theo mùa. Ví dụ: にほんには しき（よんつの きせつ）が あります。	active	manual	null	2026-08-13 07:31:58.689
15	1	14	vocabulary	春	\N	Từ '春' có nghĩa là gì?	{"Mùa xuân","Mùa hạ","Mùa thu","Mùa đông"}	0	Từ vựng "春" (/はる (haru)/) có nghĩa là: Mùa xuân. Ví dụ: はるは さくらが さきます。	active	manual	null	2026-08-13 07:31:58.689
16	1	15	vocabulary	夏	\N	Từ '夏' có nghĩa là gì?	{"Mùa hè / Mùa hạ","Mùa đông","Mùa xuân","Mùa thu"}	0	Từ vựng "夏" (/なつ (natsu)/) có nghĩa là: Mùa hè / Mùa hạ. Ví dụ: なつに うみへ いきました。	active	manual	null	2026-08-13 07:31:58.689
17	1	16	vocabulary	秋	\N	Từ '秋' có nghĩa là gì?	{"Mùa thu","Mùa hè","Mùa đông","Mùa xuân"}	0	Từ vựng "秋" (/あき (aki)/) có nghĩa là: Mùa thu. Ví dụ: あきは もみじが きれいです。	active	manual	null	2026-08-13 07:31:58.689
18	1	17	vocabulary	冬	\N	Từ '冬' có nghĩa là gì?	{"Mùa đông","Mùa xuân","Mùa hè","Mùa thu"}	0	Từ vựng "冬" (/ふゆ (fuyu)/) có nghĩa là: Mùa đông. Ví dụ: ふゆは ゆきが ふって さむいです。	active	manual	null	2026-08-13 07:31:58.689
19	1	18	vocabulary	コート	\N	Từ 'コート' có nghĩa là gì?	{"Áo khoác / Áo ấm","Áo sơ mi","Quần đùi","Giày thể thao"}	0	Từ vựng "コート" (/こーと (kooto)/) có nghĩa là: Áo khoác / Áo ấm. Ví dụ: さむいですから、コートを きましょう。	active	manual	null	2026-08-13 07:31:58.689
20	1	19	vocabulary	台風	\N	Từ '台風' có nghĩa là gì?	{"Bão / Bão nhiệt đới","Sương mù","Nắng ráo","Tuyết nhẹ"}	0	Từ vựng "台風" (/たいふう (taifuu)/) có nghĩa là: Bão / Bão nhiệt đới. Ví dụ: たいふうが きますから いえに いましょう。	active	manual	null	2026-08-13 07:31:58.689
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.topics (id, name, hidden) FROM stdin;
1	Travel	f
2	Music	f
3	Movies	f
4	Food & Culinary	f
5	Sports	f
6	Technology	f
7	Books	f
8	Gaming	f
9	Culture	f
10	Exams (IELTS/TOEIC…)	f
\.


--
-- Data for Name: user_interests; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.user_interests (id, user_id, topic_id) FROM stdin;
19	3	1
20	3	2
21	3	4
22	6	1
23	6	4
24	6	9
25	7	6
26	7	8
27	7	2
28	8	7
29	8	9
30	8	10
31	9	2
32	9	3
33	9	1
34	10	7
35	10	9
36	10	4
37	11	10
38	11	5
39	11	1
40	20	2
41	20	3
42	21	8
43	21	6
44	22	10
45	22	6
46	23	9
47	23	7
48	24	1
49	24	4
50	25	5
51	25	4
52	26	1
53	26	9
54	28	7
55	28	9
56	28	10
57	29	7
58	29	9
59	29	10
\.


--
-- Data for Name: user_languages; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.user_languages (id, user_id, language_id, role, level) FROM stdin;
17	3	1	native	\N
18	3	2	learning	3
19	6	2	native	\N
20	6	1	learning	3
21	7	4	native	\N
22	7	2	learning	4
23	8	3	native	\N
24	8	1	learning	3
25	9	5	native	\N
26	9	2	learning	3
27	10	6	native	\N
28	10	1	learning	2
29	11	2	native	\N
30	11	1	learning	4
31	20	1	native	\N
32	20	2	learning	2
33	21	1	native	\N
34	21	4	learning	3
35	22	1	native	\N
36	22	2	learning	4
37	23	1	native	\N
38	23	3	learning	4
39	24	1	native	\N
40	24	7	learning	2
41	25	2	native	\N
42	25	1	learning	2
43	26	2	native	\N
44	26	1	learning	1
45	27	7	native	\N
46	27	2	learning	1
47	28	1	fluent	C1
48	28	3	learning	1
49	29	1	native	\N
50	29	3	learning	1
\.


--
-- Data for Name: user_saved_words; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.user_saved_words (id, user_id, word_library_id, personal_note, source, status, created_at) FROM stdin;
1	28	61	\N	manual	learning	2026-08-13 07:03:03.081
3	28	63	\N	manual	learning	2026-08-13 07:03:06.774
4	28	3	\N	manual	learning	2026-08-13 07:03:07.84
5	28	4	\N	manual	learning	2026-08-13 07:03:09.102
6	28	1	\N	manual	mastered	2026-08-13 07:03:10.211
7	28	2	\N	manual	mastered	2026-08-13 07:03:11.372
2	28	62	\N	manual	mastered	2026-08-13 07:03:05.569
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.users (id, email, password_hash, google_id, display_name, avatar_url, bio, intent, gender, dob, city, country, role, status, suspended_until, last_active, timezone, available_slots, share_activity, created_at) FROM stdin;
22	user1@gmail.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	User 1 (Nguyễn Văn A)	https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150	Sinh viên ngành ngôn ngữ Anh. Muốn tìm bạn bản xứ trao đổi.	Học tập & Công việc	\N	\N	TP. Hồ Chí Minh	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:44.423
23	user2@gmail.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	User 2 (Trần Thị B)	https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150	Đam mê văn hóa Trung Quốc, muốn nâng cao kỹ năng nghe nói HSK5.	Luyện thi chứng chỉ	\N	\N	Hà Nội	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:45.311
24	user3@gmail.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	User 3 (Lê Hoàng C)	https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150	Thích du lịch, ẩm thực và nói tiếng Tây Ban Nha.	Kết bạn & Trải nghiệm	\N	\N	Cần Thơ	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:46.072
25	john.smith@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	John Smith	https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150	Hello! Expat living in Saigon. Happy to help you with English!	Giao tiếp hằng ngày	\N	\N	TP. Hồ Chí Minh	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:46.863
26	jessica.taylor@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Jessica Taylor	https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150	Digital nomad travelling across Vietnam. Love learning basic Vietnamese phrases!	Kết bạn & Trải nghiệm	\N	\N	Hội An	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:47.63
28	nijitabi2nd@gmail.com	\N	116608685638765943771	Niji Tabi 2	https://lh3.googleusercontent.com/a/ACg8ocJmkOWM77DbAZKK-l4JVaKpQGk0TUkT6VNI0AfyFRZhmARpUw=s96-c	vcbsdfb	Giao tiếp casual	\N	\N	\N	\N	member	active	\N	2026-08-13 07:52:41.757	VN	{}	t	2026-08-06 03:22:52.476
6	sarah.jenkins@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Sarah Jenkins	https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150	Hi! I am from London. I love Vietnamese street food and culture! Looking for a Tandem partner to practice conversational Vietnamese.	Giao tiếp hằng ngày	\N	\N	London	UK	member	active	\N	\N	VN	{}	t	2026-08-06 02:53:11.851
7	kenji.sato@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Kenji Sato (佐藤健司)	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150	Konnichiwa! Software engineer living in Tokyo. Interested in tech, anime, and learning languages.	Học tập & Công việc	\N	\N	Tokyo	Japan	member	active	\N	\N	VN	{}	t	2026-08-06 02:53:13.005
8	liwei@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Li Wei (李伟)	https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150	Hello! Business manager learning Vietnamese for trade. Happy to teach Mandarin!	Học tập & Công việc	\N	\N	Beijing	China	member	active	\N	\N	VN	{}	t	2026-08-06 02:53:13.856
9	minjun.park@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Min-jun Park (박민준)	https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150	K-pop & music enthusiast from Seoul. Let us exchange Korean and English/Vietnamese!	Kết bạn & Trải nghiệm	\N	\N	Seoul	Korea	member	active	\N	\N	VN	{}	t	2026-08-06 02:53:14.682
10	emma.dupont@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Emma Dupont	https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150	Bonjour! Architect from Paris. Passionate about art, literature, and Southeast Asian culture.	Kết bạn & Trải nghiệm	\N	\N	Paris	France	member	active	\N	\N	VN	{}	t	2026-08-06 02:53:15.524
11	alex.miller@example.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Alex Miller	https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150	English teacher living in Da Nang. Want to practice advanced Vietnamese and share English tips!	Luyện thi chứng chỉ	\N	\N	Đà Nẵng	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:53:16.431
20	member1@stududu.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Thành Viên 1 (Member 1)	https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150	Chào mọi người! Rất vui được tham gia cộng đồng Tandem Stududu.	Giao tiếp hằng ngày	\N	\N	Hà Nội	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:42.912
21	member2@stududu.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Thành Viên 2 (Member 2)	https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150	Thích học tiếng Nhật và giao lưu với bạn bè quốc tế.	Kết bạn & Trải nghiệm	\N	\N	Đà Nẵng	Vietnam	member	active	\N	\N	VN	{}	t	2026-08-06 02:59:43.686
27	trpgthao2004@gmail.com	$2b$10$lqCyfn0XtnRDn37aUrt2dOge198fOGZVMEQd24Dk4DTVEx5fmYtla	\N	đá đâsdadasd	\N	fdsfsd	Giao tiếp casual	\N	\N	\N	\N	member	active	\N	\N	VN	{}	t	2026-08-06 03:00:47.282
3	bekhot123@gmail.com	$2b$10$NrVstsnSw1FVYwStFyp74.91TnvVCLaOmmj8mgDecbq5Rx8FEggQK	\N	Bé Khót	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150	Người học Tiếng Anh đam mê văn hóa và giao lưu ngôn ngữ Tandem.	Giao tiếp hằng ngày	\N	\N	TP. Hồ Chí Minh	Vietnam	member	active	\N	2026-08-06 03:05:46.911	VN	{}	t	2026-08-06 02:31:08.988
29	duydangthai7@gmail.com	\N	114969105611101796094	Duy Dang Thai	https://lh3.googleusercontent.com/a/ACg8ocKXeEDsbP8ht_ju-5ipVdNeCK1BsH8a98Q05WHMAjD0AbKSHA=s96-c	sdfàvava	Giao tiếp casual	\N	\N	\N	\N	member	active	\N	2026-08-11 01:53:18.858	VN	{}	t	2026-08-06 03:30:12.315
1	admin@stududu.com	$2b$10$fILEHaDyWEbNxtXMhLYgf.178iIC9IAe4lB6nLSaXMab7Vnai5Rpm	\N	System Admin	\N	\N	\N	\N	\N	\N	\N	admin	active	\N	2026-08-13 07:34:54.59	VN	{}	t	2026-08-06 02:26:34.775
\.


--
-- Data for Name: vocab_topics; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.vocab_topics (id, name, hidden) FROM stdin;
1	Động vật	f
2	Thức ăn & đồ uống	f
3	Gia đình	f
4	Nghề nghiệp	f
5	Cơ thể & sức khoẻ	f
6	Nhà cửa & đồ dùng	f
7	Thời tiết & thiên nhiên	f
8	Giao thông & đi lại	f
9	Mua sắm & tiền bạc	f
10	Học tập & trường lớp	f
11	Cảm xúc & tính cách	f
12	Công nghệ & Internet	f
\.


--
-- Data for Name: vocab_words; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.vocab_words (id, user_id, word, translation, language, flag, label, note, from_partner, created_at) FROM stdin;
\.


--
-- Data for Name: word_library; Type: TABLE DATA; Schema: stududu; Owner: neondb_owner
--

COPY stududu.word_library (id, term, language_id, phonetic, part_of_speech, definition, example, audio_url, save_count, is_public, updated_by_id, created_at) FROM stdin;
63	沉淀 (chéndiàn)	3	/chén diàn/	ZH động từ	Accumulate and accumulate knowledge and experience	« 学习需要时间的沉淀。 »	\N	1	f	\N	2026-08-13 07:03:06.652
1	缘分	3	/yuán fèn/	noun	Fate or accidental connection brings people together.	« 我们能在这里相遇真是很有缘分。 »	\N	1	t	\N	2026-08-06 03:23:45.447
62	加油 (jiāyóu)	3	/jiā yóu/	ZH động từ	Try your best! Effort to move forward	« 考试加油，你一定可以的！ »	\N	1	f	\N	2026-08-13 07:03:05.446
4	珍重	3	/zhēn zhòng/	verb	Know how to value, appreciate and take good care of yourself.	« 朋友，请多多珍重。 »	\N	1	t	\N	2026-08-06 03:23:45.474
68	蜕变 (tuìbiàn)	3	/tuì biàn/	ZH động từ	Transforming, rising to outstanding development	« 经历磨练后的美丽蜕变。 »	\N	0	f	\N	2026-08-13 07:14:58.52
64	珍惜 (zhēnxī)	3	/zhēn xī/	ZH động từ	Appreciate and preserve precious things	« 懂得珍惜眼前的人与事。 »	\N	0	f	\N	2026-08-13 07:14:58.081
61	缘分 (yuánfèn)	3	/yuán fèn/	ZH danh từ	Duyên phận, sự kết nối tình cờ diệu kỳ	« 我们能在这里相遇真是很有缘分。 »	\N	1	f	\N	2026-08-13 07:03:02.824
3	加油	3	/jiā yóu/	verb	Để nỗ lực thêm; cổ vũ nhé!	« 考试加油，你一定可以的！ »	\N	1	t	\N	2026-08-06 03:23:45.472
2	沉淀	3	/chén diàn/	verb	Để tích lũy và giải quyết kiến ​​thức hoặc kinh nghiệm theo thời gian.	« 学习需要时间的沉淀。 »	\N	1	t	\N	2026-08-06 03:23:45.445
\.


--
-- Name: activity_posts_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.activity_posts_id_seq', 17, true);


--
-- Name: blocks_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.blocks_id_seq', 1, false);


--
-- Name: call_sessions_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.call_sessions_id_seq', 1, false);


--
-- Name: comment_likes_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.comment_likes_id_seq', 1, false);


--
-- Name: community_challenges_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.community_challenges_id_seq', 1, false);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.conversations_id_seq', 5, true);


--
-- Name: endorsements_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.endorsements_id_seq', 1, false);


--
-- Name: group_join_requests_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.group_join_requests_id_seq', 1, false);


--
-- Name: group_members_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.group_members_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.groups_id_seq', 1, false);


--
-- Name: interactions_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.interactions_id_seq', 1, false);


--
-- Name: languages_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.languages_id_seq', 8, true);


--
-- Name: match_preferences_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.match_preferences_id_seq', 3, true);


--
-- Name: match_scores_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.match_scores_id_seq', 1, false);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.matches_id_seq', 5, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.messages_id_seq', 9, true);


--
-- Name: moderation_actions_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.moderation_actions_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.notifications_id_seq', 2, true);


--
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.post_comments_id_seq', 1, true);


--
-- Name: post_likes_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.post_likes_id_seq', 1, true);


--
-- Name: question_sets_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.question_sets_id_seq', 1, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.reports_id_seq', 1, false);


--
-- Name: schedule_requests_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.schedule_requests_id_seq', 1, false);


--
-- Name: test_answers_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.test_answers_id_seq', 100, true);


--
-- Name: test_attempts_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.test_attempts_id_seq', 6, true);


--
-- Name: test_questions_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.test_questions_id_seq', 20, true);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.topics_id_seq', 10, true);


--
-- Name: user_interests_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.user_interests_id_seq', 59, true);


--
-- Name: user_languages_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.user_languages_id_seq', 50, true);


--
-- Name: user_saved_words_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.user_saved_words_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.users_id_seq', 30, true);


--
-- Name: vocab_topics_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.vocab_topics_id_seq', 12, true);


--
-- Name: vocab_words_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.vocab_words_id_seq', 1, false);


--
-- Name: word_library_id_seq; Type: SEQUENCE SET; Schema: stududu; Owner: neondb_owner
--

SELECT pg_catalog.setval('stududu.word_library_id_seq', 195, true);


--
-- Name: activity_posts activity_posts_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.activity_posts
    ADD CONSTRAINT activity_posts_pkey PRIMARY KEY (id);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: call_sessions call_sessions_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.call_sessions
    ADD CONSTRAINT call_sessions_pkey PRIMARY KEY (id);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: community_challenges community_challenges_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.community_challenges
    ADD CONSTRAINT community_challenges_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: endorsements endorsements_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.endorsements
    ADD CONSTRAINT endorsements_pkey PRIMARY KEY (id);


--
-- Name: group_join_requests group_join_requests_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_join_requests
    ADD CONSTRAINT group_join_requests_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: match_preferences match_preferences_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.match_preferences
    ADD CONSTRAINT match_preferences_pkey PRIMARY KEY (id);


--
-- Name: match_scores match_scores_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.match_scores
    ADD CONSTRAINT match_scores_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_actions moderation_actions_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.moderation_actions
    ADD CONSTRAINT moderation_actions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: question_sets question_sets_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.question_sets
    ADD CONSTRAINT question_sets_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: schedule_requests schedule_requests_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.schedule_requests
    ADD CONSTRAINT schedule_requests_pkey PRIMARY KEY (id);


--
-- Name: test_answers test_answers_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_answers
    ADD CONSTRAINT test_answers_pkey PRIMARY KEY (id);


--
-- Name: test_attempts test_attempts_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);


--
-- Name: test_questions test_questions_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_questions
    ADD CONSTRAINT test_questions_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: user_interests user_interests_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_interests
    ADD CONSTRAINT user_interests_pkey PRIMARY KEY (id);


--
-- Name: user_languages user_languages_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_languages
    ADD CONSTRAINT user_languages_pkey PRIMARY KEY (id);


--
-- Name: user_saved_words user_saved_words_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_saved_words
    ADD CONSTRAINT user_saved_words_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vocab_topics vocab_topics_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.vocab_topics
    ADD CONSTRAINT vocab_topics_pkey PRIMARY KEY (id);


--
-- Name: vocab_words vocab_words_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.vocab_words
    ADD CONSTRAINT vocab_words_pkey PRIMARY KEY (id);


--
-- Name: word_library word_library_pkey; Type: CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.word_library
    ADD CONSTRAINT word_library_pkey PRIMARY KEY (id);


--
-- Name: blocks_blocker_id_blocked_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX blocks_blocker_id_blocked_id_key ON stududu.blocks USING btree (blocker_id, blocked_id);


--
-- Name: call_sessions_caller_id_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX call_sessions_caller_id_idx ON stududu.call_sessions USING btree (caller_id);


--
-- Name: call_sessions_conversation_id_invited_at_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX call_sessions_conversation_id_invited_at_idx ON stududu.call_sessions USING btree (conversation_id, invited_at);


--
-- Name: comment_likes_comment_id_user_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX comment_likes_comment_id_user_id_key ON stududu.comment_likes USING btree (comment_id, user_id);


--
-- Name: community_challenges_starts_at_ends_at_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX community_challenges_starts_at_ends_at_idx ON stududu.community_challenges USING btree (starts_at, ends_at);


--
-- Name: conversations_match_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX conversations_match_id_key ON stududu.conversations USING btree (match_id);


--
-- Name: endorsements_giver_id_receiver_id_label_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX endorsements_giver_id_receiver_id_label_key ON stududu.endorsements USING btree (giver_id, receiver_id, label);


--
-- Name: group_join_requests_group_id_user_id_status_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX group_join_requests_group_id_user_id_status_key ON stududu.group_join_requests USING btree (group_id, user_id, status);


--
-- Name: group_members_group_id_user_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX group_members_group_id_user_id_key ON stududu.group_members USING btree (group_id, user_id);


--
-- Name: group_members_user_id_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX group_members_user_id_idx ON stududu.group_members USING btree (user_id);


--
-- Name: groups_slug_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX groups_slug_key ON stududu.groups USING btree (slug);


--
-- Name: languages_code_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX languages_code_key ON stududu.languages USING btree (code);


--
-- Name: match_preferences_user_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX match_preferences_user_id_key ON stududu.match_preferences USING btree (user_id);


--
-- Name: match_scores_match_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX match_scores_match_id_key ON stududu.match_scores USING btree (match_id);


--
-- Name: matches_member_id_candidate_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX matches_member_id_candidate_id_key ON stududu.matches USING btree (member_id, candidate_id);


--
-- Name: messages_conversation_id_sent_at_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX messages_conversation_id_sent_at_idx ON stududu.messages USING btree (conversation_id, sent_at);


--
-- Name: notifications_user_id_created_at_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX notifications_user_id_created_at_idx ON stududu.notifications USING btree (user_id, created_at);


--
-- Name: post_likes_post_id_user_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX post_likes_post_id_user_id_key ON stududu.post_likes USING btree (post_id, user_id);


--
-- Name: question_sets_language_id_topic_id_level_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX question_sets_language_id_topic_id_level_key ON stududu.question_sets USING btree (language_id, topic_id, level);


--
-- Name: question_sets_status_language_id_level_order_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX question_sets_status_language_id_level_order_idx ON stududu.question_sets USING btree (status, language_id, level_order);


--
-- Name: test_answers_attempt_id_question_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX test_answers_attempt_id_question_id_key ON stududu.test_answers USING btree (attempt_id, question_id);


--
-- Name: test_attempts_challenge_id_correct_count_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX test_attempts_challenge_id_correct_count_idx ON stududu.test_attempts USING btree (challenge_id, correct_count);


--
-- Name: test_attempts_user_id_challenge_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX test_attempts_user_id_challenge_id_key ON stududu.test_attempts USING btree (user_id, challenge_id);


--
-- Name: test_attempts_user_id_set_id_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX test_attempts_user_id_set_id_idx ON stududu.test_attempts USING btree (user_id, set_id);


--
-- Name: test_attempts_user_id_started_at_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX test_attempts_user_id_started_at_idx ON stududu.test_attempts USING btree (user_id, started_at);


--
-- Name: test_questions_set_id_status_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX test_questions_set_id_status_idx ON stududu.test_questions USING btree (set_id, status);


--
-- Name: topics_name_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX topics_name_key ON stududu.topics USING btree (name);


--
-- Name: user_interests_user_id_topic_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX user_interests_user_id_topic_id_key ON stududu.user_interests USING btree (user_id, topic_id);


--
-- Name: user_languages_user_id_language_id_role_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX user_languages_user_id_language_id_role_key ON stududu.user_languages USING btree (user_id, language_id, role);


--
-- Name: user_saved_words_user_id_word_library_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX user_saved_words_user_id_word_library_id_key ON stududu.user_saved_words USING btree (user_id, word_library_id);


--
-- Name: users_email_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_email_key ON stududu.users USING btree (email);


--
-- Name: users_google_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_google_id_key ON stududu.users USING btree (google_id);


--
-- Name: vocab_topics_name_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX vocab_topics_name_key ON stududu.vocab_topics USING btree (name);


--
-- Name: vocab_words_user_id_created_at_idx; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE INDEX vocab_words_user_id_created_at_idx ON stududu.vocab_words USING btree (user_id, created_at);


--
-- Name: word_library_term_language_id_key; Type: INDEX; Schema: stududu; Owner: neondb_owner
--

CREATE UNIQUE INDEX word_library_term_language_id_key ON stududu.word_library USING btree (term, language_id);


--
-- Name: activity_posts activity_posts_group_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.activity_posts
    ADD CONSTRAINT activity_posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES stududu.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activity_posts activity_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.activity_posts
    ADD CONSTRAINT activity_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blocks blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.blocks
    ADD CONSTRAINT blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: blocks blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.blocks
    ADD CONSTRAINT blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_sessions call_sessions_callee_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.call_sessions
    ADD CONSTRAINT call_sessions_callee_id_fkey FOREIGN KEY (callee_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_sessions call_sessions_caller_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.call_sessions
    ADD CONSTRAINT call_sessions_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: call_sessions call_sessions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.call_sessions
    ADD CONSTRAINT call_sessions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES stududu.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES stududu.post_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_challenges community_challenges_set_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.community_challenges
    ADD CONSTRAINT community_challenges_set_id_fkey FOREIGN KEY (set_id) REFERENCES stududu.question_sets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: conversations conversations_match_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.conversations
    ADD CONSTRAINT conversations_match_id_fkey FOREIGN KEY (match_id) REFERENCES stududu.matches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: endorsements endorsements_giver_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.endorsements
    ADD CONSTRAINT endorsements_giver_id_fkey FOREIGN KEY (giver_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: endorsements endorsements_receiver_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.endorsements
    ADD CONSTRAINT endorsements_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_join_requests group_join_requests_group_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_join_requests
    ADD CONSTRAINT group_join_requests_group_id_fkey FOREIGN KEY (group_id) REFERENCES stududu.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_join_requests group_join_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_join_requests
    ADD CONSTRAINT group_join_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: group_join_requests group_join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_join_requests
    ADD CONSTRAINT group_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES stududu.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups groups_creator_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.groups
    ADD CONSTRAINT groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups groups_language_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.groups
    ADD CONSTRAINT groups_language_id_fkey FOREIGN KEY (language_id) REFERENCES stududu.languages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: groups groups_topic_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.groups
    ADD CONSTRAINT groups_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES stududu.topics(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: interactions interactions_match_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.interactions
    ADD CONSTRAINT interactions_match_id_fkey FOREIGN KEY (match_id) REFERENCES stududu.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interactions interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.interactions
    ADD CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: match_preferences match_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.match_preferences
    ADD CONSTRAINT match_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_scores match_scores_match_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.match_scores
    ADD CONSTRAINT match_scores_match_id_fkey FOREIGN KEY (match_id) REFERENCES stududu.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_candidate_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.matches
    ADD CONSTRAINT matches_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: matches matches_member_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.matches
    ADD CONSTRAINT matches_member_id_fkey FOREIGN KEY (member_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES stududu.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: moderation_actions moderation_actions_admin_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.moderation_actions
    ADD CONSTRAINT moderation_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: moderation_actions moderation_actions_target_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.moderation_actions
    ADD CONSTRAINT moderation_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_comments
    ADD CONSTRAINT post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES stududu.post_comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES stududu.activity_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES stududu.activity_posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: question_sets question_sets_language_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.question_sets
    ADD CONSTRAINT question_sets_language_id_fkey FOREIGN KEY (language_id) REFERENCES stududu.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: question_sets question_sets_topic_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.question_sets
    ADD CONSTRAINT question_sets_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES stududu.vocab_topics(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reports reports_reported_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.reports
    ADD CONSTRAINT reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: schedule_requests schedule_requests_conversation_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.schedule_requests
    ADD CONSTRAINT schedule_requests_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES stududu.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_requests schedule_requests_proposer_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.schedule_requests
    ADD CONSTRAINT schedule_requests_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: test_answers test_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_answers
    ADD CONSTRAINT test_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES stududu.test_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: test_answers test_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_answers
    ADD CONSTRAINT test_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES stududu.test_questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: test_attempts test_attempts_challenge_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_attempts
    ADD CONSTRAINT test_attempts_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES stududu.community_challenges(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: test_attempts test_attempts_set_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_attempts
    ADD CONSTRAINT test_attempts_set_id_fkey FOREIGN KEY (set_id) REFERENCES stududu.question_sets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: test_attempts test_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_attempts
    ADD CONSTRAINT test_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: test_questions test_questions_set_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.test_questions
    ADD CONSTRAINT test_questions_set_id_fkey FOREIGN KEY (set_id) REFERENCES stududu.question_sets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_interests user_interests_topic_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_interests
    ADD CONSTRAINT user_interests_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES stududu.topics(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_interests user_interests_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_interests
    ADD CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_languages user_languages_language_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_languages
    ADD CONSTRAINT user_languages_language_id_fkey FOREIGN KEY (language_id) REFERENCES stududu.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_languages user_languages_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_languages
    ADD CONSTRAINT user_languages_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_saved_words user_saved_words_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_saved_words
    ADD CONSTRAINT user_saved_words_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_saved_words user_saved_words_word_library_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.user_saved_words
    ADD CONSTRAINT user_saved_words_word_library_id_fkey FOREIGN KEY (word_library_id) REFERENCES stududu.word_library(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vocab_words vocab_words_user_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.vocab_words
    ADD CONSTRAINT vocab_words_user_id_fkey FOREIGN KEY (user_id) REFERENCES stududu.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: word_library word_library_language_id_fkey; Type: FK CONSTRAINT; Schema: stududu; Owner: neondb_owner
--

ALTER TABLE ONLY stududu.word_library
    ADD CONSTRAINT word_library_language_id_fkey FOREIGN KEY (language_id) REFERENCES stududu.languages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict PFD98otrLJWhj7gsvAWXwydM2I2hUxqh7yJv2fUiqqi3JdVex8pkueh02mQ6fkP

