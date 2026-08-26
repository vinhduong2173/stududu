"use client";

import * as React from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useTranslations } from "next-intl";
import { FeedPost } from "@/components/features/PostCard";

export interface ProfilePostComposerProps {
  me: {
    id: number;
    displayName: string;
    avatarUrl?: string | null;
  };
  onPostCreated: (post: FeedPost) => void;
  showToast: (message: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ProfilePostComposer({
  me,
  onPostCreated,
  showToast,
  textareaRef,
}: ProfilePostComposerProps) {
  const t = useTranslations("profile");
  const tComm = useTranslations("community");
  const [draft, setDraft] = React.useState("");
  const [image, setImage] = React.useState<string | null>(null);
  const [posting, setPosting] = React.useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(tComm("image_size_error") || "Dung lượng ảnh không được vượt quá 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    const content = draft.trim();
    if (!content && !image) return;
    setPosting(true);
    try {
      const created = await api<FeedPost & { _count?: { likes: number } }>("/community/posts", {
        method: "POST",
        body: { content, imageUrl: image || undefined },
      });
      onPostCreated({
        ...created,
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        word: null,
        user: {
          id: me.id,
          displayName: me.displayName,
          avatarUrl: me.avatarUrl,
        },
      });
      setDraft("");
      setImage(null);
      showToast(tComm("post_create_success") || "Đã đăng bài chia sẻ thành công");
    } catch (err: any) {
      showToast(err.message || "Không thể đăng bài");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl p-5 shadow-sm border border-border">
      <div className="flex items-start gap-3">
        <Avatar
          src={me.avatarUrl ?? undefined}
          fallback={me.displayName.charAt(0)}
          size="md"
          className="shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder={t("post_placeholder", { name: me.displayName })}
            className="w-full rounded-2xl border border-border/80 bg-surface-2/60 p-3.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24"
          />

          {image && (
            <div className="relative mt-3 w-32 h-32 rounded-2xl overflow-hidden border border-border/80 bg-muted/5 group shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute top-1.5 right-1.5 p-1 bg-foreground/80 hover:bg-foreground text-surface rounded-full transition-colors shadow-sm cursor-pointer"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              <label
                className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-2 text-muted hover:text-primary transition-colors"
                title={tComm("add_image") || "Thêm hình ảnh"}
              >
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={posting}
                />
              </label>
              <span className="text-xs text-muted/80">{draft.length}/500</span>
            </div>
            <Button
              size="sm"
              onClick={handlePost}
              disabled={(!draft.trim() && !image) || posting}
              className="rounded-full px-5 font-bold shadow-xs cursor-pointer"
            >
              {posting ? "..." : tComm("post_button") || "Đăng"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
