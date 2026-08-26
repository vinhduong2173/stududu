"use client";

import * as React from "react";
import { CornerUpLeft, MoreVertical, Pencil, Smile, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, REACTION_EMOJIS } from "@/hooks/useChatInbox";

interface MessageActionMenuProps {
  mine: boolean;
  m: Message;
  t: any;
  reactionPickerFor: number | null;
  setReactionPickerFor: React.Dispatch<React.SetStateAction<number | null>>;
  handleToggleReaction: (msgId: number, emoji: string) => void;
  onReply: (m: Message) => void;
  onEdit?: (m: Message) => void;
  onDelete?: (msgId: number) => void;
}

export function MessageActionMenu({
  mine,
  m,
  t,
  reactionPickerFor,
  setReactionPickerFor,
  handleToggleReaction,
  onReply,
  onEdit,
  onDelete,
}: MessageActionMenuProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isDeleted = Boolean(m.payload && "isDeleted" in m.payload && m.payload.isDeleted);

  if (isDeleted) return null;

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm(t("chat.delete_confirm"))) {
      onDelete?.(m.id);
    }
  };

  return (
    <div className={cn("relative flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10")}>
      {/* Nút Reaction */}
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          setReactionPickerFor((prev) => (prev === m.id ? null : m.id));
        }}
        className="p-1 text-muted hover:text-foreground rounded-full bg-surface shadow-xs border border-border"
        title={t("chat.react_tooltip") || "Thả cảm xúc"}
      >
        <Smile className="h-3.5 w-3.5" />
      </button>

      {/* Emoji Picker Popup */}
      {reactionPickerFor === m.id && (
        <div className={cn("absolute bottom-full mb-1 flex items-center gap-1 rounded-full bg-surface border border-border p-1 shadow-lg z-30", mine ? "right-0" : "left-0")}>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleToggleReaction(m.id, emoji)}
              className="p-1 hover:scale-125 transition-transform text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Nút Trả lời */}
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          onReply(m);
        }}
        className="p-1 text-muted hover:text-primary rounded-full bg-surface shadow-xs border border-border"
        title={t("chat.reply") || "Trả lời"}
      >
        <CornerUpLeft className="h-3.5 w-3.5" />
      </button>

      {/* Nút Menu thêm (Chỉnh sửa & Xóa cho tin nhắn của mình) */}
      {mine && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-1 text-muted hover:text-foreground rounded-full bg-surface shadow-xs border border-border"
            title="Thao tác khác"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-full mb-1 z-30 w-36 rounded-xl border border-border bg-surface shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {m.type === "text" && onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(m);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left font-medium text-foreground hover:bg-muted/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-primary" />
                    <span>{t("chat.edit") || "Chỉnh sửa"}</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("chat.delete") || "Thu hồi"}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
