"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import { useTransition } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageFlag, getLanguageInfo } from "@/lib/languages";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("langSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const supportedLocales = routing.locales;

  const currentInfo = getLanguageInfo(locale);

  const switchLocale = (nextLocale: string) => {
    setIsOpen(false);
    if (nextLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 outline-none select-none",
          isOpen
            ? "border-primary bg-primary/10 text-primary shadow-sm"
            : "border-border/80 bg-surface hover:bg-muted/10 text-foreground hover:border-primary/40 shadow-2xs"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <LanguageFlag code={locale} className="w-4 h-4 shrink-0" />
        <span>{currentInfo.nativeName}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[170px] rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-0.5">
            {supportedLocales.map((code) => {
              const info = getLanguageInfo(code);
              const isActive = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => switchLocale(code)}
                  disabled={isPending}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 text-left outline-none",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/15 hover:text-primary"
                  )}
                >
                  <LanguageFlag code={code} className="w-4.5 h-4.5 shrink-0" />
                  <span className="truncate">{info.nativeName}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

