"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProBadge } from "@/components/ui/ProBadge";
import { Link } from "@/i18n/routing";
import { TIMEZONES } from "@/lib/timezones";

interface ProFilterSectionProps {
  enabled: boolean;
  timezone: string;
  onChange: (timezone: string) => void;
}

/**
 * SRS §3.2 — bộ lọc ghép đôi nâng cao, hạng mục Pro duy nhất không phải hạn mức.
 *
 * Lằn ranh phải giữ: đây là khối lọc THÊM VÀO, không phải khối bị lấy đi. Người
 * dùng Free vẫn thấy đủ 100% ứng viên theo đúng MATCH_SCORE, các bộ lọc cũ bên
 * dưới vẫn dùng bình thường — nên khối này khoá lại chứ không làm hỏng gì khác.
 */
export function ProFilterSection({
  enabled,
  timezone,
  onChange,
}: ProFilterSectionProps) {
  const t = useTranslations("discover.proFilter");

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Globe className="h-3.5 w-3.5 text-primary" />
          {t("timezoneLabel")}
        </label>
        <ProBadge locked={!enabled} />
      </div>

      <select
        className="w-full rounded-xl border-2 border-border bg-surface px-3 py-2.5 text-sm font-medium transition-colors focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        value={timezone}
        disabled={!enabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("timezoneAll")}</option>
        {TIMEZONES.map((tz) => (
          <option key={tz.code} value={tz.code}>
            {tz.flag} {tz.name}
          </option>
        ))}
      </select>

      {!enabled && (
        <p className="mt-2 text-xs text-muted">
          {t("lockedHint")}{" "}
          <Link href="/pricing" className="font-semibold text-primary hover:underline">
            {t("lockedCta")}
          </Link>
        </p>
      )}
    </div>
  );
}
