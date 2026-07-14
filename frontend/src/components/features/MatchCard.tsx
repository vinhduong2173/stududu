import * as React from "react"
import { Avatar } from "@/components/ui/Avatar"
import { Chip } from "@/components/ui/Chip"
import { Button } from "@/components/ui/Button"
import { Heart, MapPin } from "lucide-react"
import Link from "next/link"
import { ageFromDob, cn } from "@/lib/utils"

export interface MatchCardProps {
  user: {
    id: number;
    displayName: string;
    avatarUrl?: string;
    lastActive?: string;
    dob?: string | null;
    city?: string | null;
    languages: any[];
  };
  whyMatched?: {
    sharedTopics?: string[];
  };
  /** Đã thích rồi → nút chuyển "Đã thích" (logic mới: card không biến mất) */
  liked?: boolean;
  onLike: () => void;
}

export function MatchCard({ user, whyMatched, liked, onLike }: MatchCardProps) {
  const isOnline = user.lastActive ? new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false;

  const teachLangs = user.languages.filter(l => l.role === "native" || l.role === "fluent");
  const learnLangs = user.languages.filter(l => l.role === "learning");
  const age = ageFromDob(user.dob);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col hover:shadow-md transition-shadow relative group overflow-hidden">
      <Link href={`/profile/${user.id}`} className="absolute inset-0 z-0" />

      <div className="flex items-center gap-4 mb-4 z-10 pointer-events-none">
        <Avatar src={user.avatarUrl} fallback={user.displayName.charAt(0)} size="lg" online={isOnline} />
        <div>
          <h3 className="font-bold text-lg text-foreground">
            {user.displayName}
            {age !== null && <span className="font-medium text-muted">, {age}</span>}
          </h3>
          <p className="text-sm text-muted flex items-center gap-1.5">
            {isOnline ? "Đang hoạt động" : "Hoạt động gần đây"}
            {user.city && (
              <span className="inline-flex items-center gap-0.5">
                · <MapPin className="w-3 h-3" /> {user.city}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6 z-10 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium w-12 text-muted">Nói:</span>
          {teachLangs.map(l => (
            <Chip key={l.id} variant="default" className="text-xs py-0.5">
              {l.language?.name} {l.role === "native" ? "(Mẹ đẻ)" : "(Thành thạo)"}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium w-12 text-muted">Học:</span>
          {learnLangs.map(l => (
            <Chip key={l.id} variant="secondary" className="text-xs py-0.5">
              {l.language?.name} (Lvl {l.level})
            </Chip>
          ))}
        </div>
      </div>

      {whyMatched && whyMatched.sharedTopics && whyMatched.sharedTopics.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-6 z-10 pointer-events-none">
          <div className="text-xs font-bold text-success flex items-center gap-1.5 mb-1">
            <span>🔄</span> Chung sở thích
          </div>
          <p className="text-sm text-foreground font-medium">
            {whyMatched.sharedTopics.join(", ")}
          </p>
        </div>
      )}

      <div className="mt-auto z-10">
        <Button
          variant={liked ? "ghost" : "secondary"}
          disabled={liked}
          className={cn(
            "w-full rounded-xl transition-transform",
            liked
              ? "border border-success/40 text-success disabled:opacity-100 bg-success/5"
              : "hover:scale-[1.02]",
          )}
          onClick={(e) => { e.preventDefault(); if (!liked) onLike(); }}
        >
          <Heart className={cn("w-5 h-5 mr-2", liked ? "fill-success" : "fill-current")} />
          {liked ? "Đã thích" : "Thích"}
        </Button>
      </div>
    </div>
  )
}
