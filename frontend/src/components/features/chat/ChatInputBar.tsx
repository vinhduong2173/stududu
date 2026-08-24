"use client";

import * as React from "react";
import { EmojiPicker } from "@/components/features/EmojiPicker";
import { Image as ImageIcon, Send, Smile, Sparkles } from "lucide-react";
import { QuotaChip } from "@/components/ui/QuotaChip";
import { useEntitlements } from "@/hooks/useEntitlements";

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
  onOpenQuizShare?: () => void;
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
  onOpenQuizShare,
}: ChatInputBarProps) {
  // EP-11 — chỉ ẢNH có hạn mức (chi phí lưu trữ). BR-38: ô soạn tin nhắn text
  // và nút gọi KHÔNG bao giờ bị chặn, kể cả khi hạn mức ảnh đã hết.
  const { entitlement } = useEntitlements();
  const images = entitlement("chat.image_upload");
  const imagesExhausted = images ? !images.allowed : false;

  return (
    <div className="p-4 border-t border-border bg-surface shrink-0 relative">
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

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imagesExhausted}
            className="p-2.5 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title={t("chat.attach_photo")}
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          {(imagesExhausted || images?.warn) && <QuotaChip entitlement={images} />}
        </div>

        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="p-2.5 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          title={t("chat.emoji")}
        >
          <Smile className="h-5 w-5" />
        </button>

        {onOpenQuizShare && (
          <button
            type="button"
            onClick={onOpenQuizShare}
            className="p-2.5 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-full transition-colors"
            title="Gửi bài thi Quiz cho bạn chat"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          placeholder={t("chat.input_placeholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
