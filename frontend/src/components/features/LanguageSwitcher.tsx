"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("langSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Globe className="h-4 w-4 text-muted shrink-0" />
      <button
        onClick={() => switchLocale("vi")}
        disabled={isPending}
        className={cn(
          "px-2 py-1 text-xs font-semibold rounded-md transition-all",
          locale === "vi"
            ? "bg-primary/10 text-primary"
            : "text-muted hover:text-foreground hover:bg-muted/10"
        )}
      >
        VI
      </button>
      <span className="text-muted/40 text-xs">/</span>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={cn(
          "px-2 py-1 text-xs font-semibold rounded-md transition-all",
          locale === "en"
            ? "bg-primary/10 text-primary"
            : "text-muted hover:text-foreground hover:bg-muted/10"
        )}
      >
        EN
      </button>
    </div>
  );
}
