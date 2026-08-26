"use client";

import * as React from "react";
import { EmojiPicker } from "@/components/features/EmojiPicker";
import { Image as ImageIcon, Send, Smile } from "lucide-react";
import { ChatInputReplyBar } from "./ChatInputReplyBar";
import { ReplyToInfo } from "./MessageReplyQuote";
import { Message } from "@/hooks/useChatInbox";

interface ChatInputBarProps {
  t: any;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  handleSend: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  showEmoji: boolean;
  setShowEmoji: React.Dispatch<React.SetStateAction<boolean>>;
  replyingTo: ReplyToInfo | null;
  editingMessage: Message | null;
  onCancelReplyOrEdit: () => void;
}

export function ChatInputBar({
  t,
  draft,
  setDraft,
  handleSend,
  handleImageUpload,
  fileInputRef,
  inputRef,
  showEmoji,
  setShowEmoji,
  replyingTo,
  editingMessage,
  onCancelReplyOrEdit,
}: ChatInputBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onCancelReplyOrEdit();
    }
  };

  return (
    <div className="border-t border-border bg-surface shrink-0 relative">
      <ChatInputReplyBar
        replyingTo={replyingTo}
        editingMessage={editingMessage}
        t={t}
        onCancel={onCancelReplyOrEdit}
      />

      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 z-30">
          <EmojiPicker
            onSelect={(emoji) => {
              setDraft((prev) => prev + emoji);
              inputRef.current?.focus();
            }}
          />
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          title={t("chat.attach_photo")}
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="p-2.5 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          title={t("chat.emoji")}
        >
          <Smile className="h-5 w-5" />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder={t("chat.input_placeholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:hover:bg-primary"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
