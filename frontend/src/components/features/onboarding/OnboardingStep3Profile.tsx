"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COUNTRIES } from "@/hooks/useRegister";
import { Sparkles, ArrowRight } from "lucide-react";

interface OnboardingStep3ProfileProps {
  t: any;
  tRoot: any;
  country: string;
  setCountry: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  intent: string;
  setIntent: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  setStep: (step: number) => void;
  submitStep3: () => void;
  loading: boolean;
}

export function OnboardingStep3Profile({
  t,
  tRoot,
  country,
  setCountry,
  city,
  setCity,
  intent,
  setIntent,
  bio,
  setBio,
  setStep,
  submitStep3,
  loading,
}: OnboardingStep3ProfileProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold font-display text-foreground mb-1.5">
          {t("profile_title")}
        </h2>
        <p className="text-muted text-xs sm:text-sm mb-6 leading-relaxed">
          {t("profile_subtitle")}
        </p>

        <div className="space-y-4">
          {/* Location fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                {tRoot("register.country") || "Quốc gia / Quê quán"}
              </label>
              <select
                className="w-full h-12 rounded-xl border border-border bg-surface-2/60 px-3.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-medium text-sm text-foreground transition-all shadow-2xs"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                {tRoot("profile.lives_in") || "Nơi sinh sống (Thành phố)"}
              </label>
              <Input
                placeholder={tRoot("profile.city_placeholder") || "Ví dụ: Hà Nội, Tokyo..."}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 bg-surface-2/60"
              />
            </div>
          </div>

          {/* Language Intent */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t("intent_label")}</label>
            <select
              className="w-full h-12 rounded-xl border border-border bg-surface-2/60 px-3.5 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-medium text-sm text-foreground transition-all shadow-2xs"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            >
              <option value="Giao tiếp casual">{t("intent_casual")}</option>
              <option value="Thi cử">{t("intent_exam")}</option>
              <option value="Du lịch">{t("intent_travel")}</option>
              <option value="Làm việc">{t("intent_work")}</option>
            </select>
          </div>

          {/* Bio & Tip */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-muted">{t("bio_label")}</label>
              <span className="text-[11px] font-semibold text-muted">{bio.length}/500</span>
            </div>
            <textarea
              className="w-full rounded-2xl border border-border bg-surface-2/60 p-4 outline-none focus:border-primary focus:bg-surface resize-none h-28 text-sm text-foreground transition-all shadow-2xs"
              placeholder={t("bio_placeholder")}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className="flex items-start gap-2 text-xs text-teal-900 bg-teal-50/90 p-3 rounded-xl border border-teal-200/70 mt-2 font-medium">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{t("bio_tip")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-border/70">
        <Button variant="ghost" className="h-12 rounded-full px-6 font-semibold" onClick={() => setStep(2)} disabled={loading}>
          {t("back_btn")}
        </Button>
        <Button className="flex-1 sd-btn-gradient h-12 rounded-full font-bold text-sm shadow-card gap-2 active:scale-[0.98] transition-all cursor-pointer group" onClick={submitStep3} disabled={loading}>
          <span>{loading ? t("loading") : t("finish_btn")}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
