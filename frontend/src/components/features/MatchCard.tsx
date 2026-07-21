import * as React from "react"
import { Avatar } from "@/components/ui/Avatar"
import { Chip } from "@/components/ui/Chip"
import { Button } from "@/components/ui/Button"
import { Heart, MapPin } from "lucide-react"
import Link from "next/link"
import { ageFromDob, cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { getTopicTranslation } from "@/lib/i18nHelper"

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
  liked?: boolean;
  onLike: () => void;
  onUnlike?: () => void;
}

export function MatchCard({ user, whyMatched, liked, onLike, onUnlike }: MatchCardProps) {
  const t = useTranslations("discover");
  const tRoot = useTranslations();
  const [isHovered, setIsHovered] = React.useState(false);
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
            {isOnline ? t("card_online") : t("card_recent")}
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
          <span className="text-sm font-medium w-12 text-muted">{t("card_speaks")}</span>
          {teachLangs.map(l => (
            <Chip key={l.id} variant="default" className="text-xs py-0.5">
              {l.language?.name} {l.role === "native" ? t("card_native") : t("card_fluent")}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium w-12 text-muted">{t("card_learns")}</span>
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
            <span>🔄</span> {t("card_interests")}
          </div>
          <p className="text-sm text-foreground font-medium">
            {whyMatched.sharedTopics.map((topic) => getTopicTranslation(topic, tRoot)).join(", ")}
          </p>
        </div>
      )}

      <div className="mt-auto z-10" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <Button
          variant={liked ? (isHovered ? "ghost" : "secondary") : "secondary"}
          className={cn(
            "w-full rounded-xl transition-all duration-200",
            liked
              ? isHovered
                ? "text-error border border-error hover:bg-error/5"
                : "border border-success/40 text-success bg-success/5"
              : "hover:scale-[1.02]",
          )}
          onClick={(e) => {
            e.preventDefault();
            if (liked) {
              onUnlike?.();
            } else {
              onLike();
            }
          }}
        >
          <Heart className={cn("w-5 h-5 mr-2", liked ? (isHovered ? "fill-none text-error" : "fill-success") : "fill-current")} />
          {liked
            ? isHovered
              ? t("card_unlike") || "Bỏ thích"
              : t("card_liked")
            : t("card_like")}
        </Button>
      </div>
    </div>
  )
}
