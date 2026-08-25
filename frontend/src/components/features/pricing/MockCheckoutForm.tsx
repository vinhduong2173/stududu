"use client";

import * as React from "react";
import { CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "@/i18n/routing";
import { ApiError } from "@/lib/api";
import { confirmCheckout, formatPrice } from "@/lib/subscription";

/** Bộ số thẻ test theo SRS §7.2 — hiển thị luôn để demo được cả 3 luồng. */
const TEST_CARDS = [
  { number: "4242 4242 4242 4242", caseKey: "success" },
  { number: "4000 0000 0000 0341", caseKey: "dunning" },
  { number: "4000 0000 0000 0002", caseKey: "declined" },
] as const;

export function MockCheckoutForm({
  sessionId,
  amount,
}: {
  sessionId: string;
  amount: number;
}) {
  const t = useTranslations("pricing.checkout");
  const locale = useLocale();
  const router = useRouter();
  const [card, setCard] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await confirmCheckout(sessionId, card);
      router.push("/pricing");
    } catch (err) {
      // US-38 AC3 — thẻ bị từ chối: ở lại trang, nêu lỗi kèm gợi ý thử thẻ khác.
      setError(err instanceof ApiError ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CreditCard className="h-5 w-5 text-primary" />
          {t("cardLabel")}
        </div>

        <div className="mt-3">
          <Input
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={card}
            onChange={(e) => setCard(e.target.value)}
            error={error ?? undefined}
          />
        </div>

        <Button type="submit" className="mt-4 w-full" disabled={busy || card.length < 12}>
          {t("pay", { price: formatPrice(amount, locale) })}
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("testCardsTitle")}
        </p>
        <ul className="mt-2 space-y-2">
          {TEST_CARDS.map((c) => (
            <li key={c.number} className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setCard(c.number)}
                className="rounded-lg bg-muted/10 px-2 py-1 font-mono text-xs text-foreground hover:bg-muted/20"
              >
                {c.number}
              </button>
              <span className="text-xs text-muted">
                {t(`testCards.${c.caseKey}` as never)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
