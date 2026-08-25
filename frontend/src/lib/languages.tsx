import * as React from "react";
import { cn } from "@/lib/utils";

export type LanguageInfo = {
  code: string;
  countryCode: string;
  flagEmoji: string;
  englishName: string;
  nativeName: string;
  displayName: string;
};

const LANGUAGE_MAP: Record<string, Omit<LanguageInfo, "code" | "displayName">> = {
  vi: { countryCode: "vn", flagEmoji: "🇻🇳", englishName: "Vietnamese", nativeName: "Tiếng Việt" },
  en: { countryCode: "gb", flagEmoji: "🇬🇧", englishName: "English", nativeName: "English" },
  id: { countryCode: "id", flagEmoji: "🇮🇩", englishName: "Indonesian", nativeName: "Bahasa Indonesia" },
  ja: { countryCode: "jp", flagEmoji: "🇯🇵", englishName: "Japanese", nativeName: "日本語" },
  ko: { countryCode: "kr", flagEmoji: "🇰🇷", englishName: "Korean", nativeName: "한국어" },
  zh: { countryCode: "cn", flagEmoji: "🇨🇳", englishName: "Chinese", nativeName: "中文" },
  fr: { countryCode: "fr", flagEmoji: "🇫🇷", englishName: "French", nativeName: "Français" },
  de: { countryCode: "de", flagEmoji: "🇩🇪", englishName: "German", nativeName: "Deutsch" },
  es: { countryCode: "es", flagEmoji: "🇪🇸", englishName: "Spanish", nativeName: "Español" },
  it: { countryCode: "it", flagEmoji: "🇮🇹", englishName: "Italian", nativeName: "Italiano" },
  ru: { countryCode: "ru", flagEmoji: "🇷🇺", englishName: "Russian", nativeName: "Русский" },
  th: { countryCode: "th", flagEmoji: "🇹🇭", englishName: "Thai", nativeName: "ไทย" },
  pt: { countryCode: "pt", flagEmoji: "🇵🇹", englishName: "Portuguese", nativeName: "Português" },
  ar: { countryCode: "sa", flagEmoji: "🇸🇦", englishName: "Arabic", nativeName: "العربية" },
  hi: { countryCode: "in", flagEmoji: "🇮🇳", englishName: "Hindi", nativeName: "हिन्दी" },
};

/**
 * Returns localized language name based on current viewer's locale
 */
export function getLocalizedLanguageName(langCode: string, locale: string = "en"): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "language" });
    const name = dn.of(langCode);
    if (name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch (e) {
    // Fallback if Intl.DisplayNames is not supported
  }
  return LANGUAGE_MAP[langCode]?.nativeName || langCode;
}

export function getLanguageInfo(code?: string | null, name?: string | null, currentLocale?: string | null): LanguageInfo {
  const normCode = (code || "").toLowerCase().trim();
  const normName = (name || "").toLowerCase().trim();

  let matchedCode: string | null = null;
  let item: Omit<LanguageInfo, "code" | "displayName"> | null = null;

  if (normCode && LANGUAGE_MAP[normCode]) {
    matchedCode = normCode;
    item = LANGUAGE_MAP[normCode];
  } else {
    for (const [c, mappedItem] of Object.entries(LANGUAGE_MAP)) {
      if (
        (normName && normName.includes(mappedItem.englishName.toLowerCase())) ||
        (normName && normName.includes(mappedItem.nativeName.toLowerCase())) ||
        mappedItem.englishName.toLowerCase() === normName ||
        mappedItem.nativeName.toLowerCase() === normName
      ) {
        matchedCode = c;
        item = mappedItem;
        break;
      }
    }
  }

  if (matchedCode && item) {
    const targetLocale = currentLocale || "en";
    const localizedAnnotation = getLocalizedLanguageName(matchedCode, targetLocale);
    
    // If nativeName is same as localized annotation (e.g. English in 'en' or Tiếng Việt in 'vi')
    const displayName =
      item.nativeName.toLowerCase() === localizedAnnotation.toLowerCase()
        ? item.nativeName
        : `${item.nativeName} (${localizedAnnotation})`;

    return { code: matchedCode, displayName, ...item };
  }

  const rawName = name || code || "Unknown";
  const fallbackCode = normCode.length === 2 ? normCode : "un";
  return {
    code: fallbackCode,
    countryCode: fallbackCode,
    flagEmoji: "🌐",
    englishName: rawName,
    nativeName: rawName,
    displayName: rawName,
  };
}

export function LanguageFlag({
  code,
  name,
  className = "w-7 h-7",
}: {
  code?: string | null;
  name?: string | null;
  className?: string;
}) {
  const info = getLanguageInfo(code, name);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden border border-border/60 shrink-0 flex items-center justify-center bg-surface-2 shadow-2xs",
        className
      )}
    >
      {!hasError && info.countryCode && info.countryCode !== "un" ? (
        <img
          src={`https://flagcdn.com/w80/${info.countryCode}.png`}
          alt={info.englishName}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-xs leading-none select-none">{info.flagEmoji}</span>
      )}
    </div>
  );
}

export function getLevelText(level?: string | null): string {
  if (!level) return "";

  const trimmed = level.trim();
  switch (trimmed) {
    case "1":
      return "Mới bắt đầu (A1)";
    case "2":
      return "Sơ cấp (A2)";
    case "3":
      return "Trung cấp (B1)";
    case "4":
      return "Khá (B2)";
    case "5":
      return "Thành thạo (C1/C2)";
    default:
      if (trimmed.match(/^N[1-5]$/i)) {
        return `JLPT ${trimmed.toUpperCase()}`;
      }
      if (trimmed.match(/^HSK\s*[1-6]$/i)) {
        return trimmed.toUpperCase();
      }
      if (trimmed.match(/^TOPIK\s*[1-6]$/i)) {
        return trimmed.toUpperCase();
      }
      if (trimmed.match(/^[A-C][1-2]$/i)) {
        return `CEFR ${trimmed.toUpperCase()}`;
      }
      return trimmed.startsWith("Level") || trimmed.startsWith("Trình độ")
        ? trimmed
        : `Trình độ ${trimmed}`;
  }
}

export function LevelBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const labelText = getLevelText(level);

  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-2 text-muted border border-border/60 shrink-0">
      {labelText}
    </span>
  );
}
