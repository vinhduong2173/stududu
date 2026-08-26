"use client";

import * as React from "react";

interface RegisterProfileDetailsProps {
  t: any;
  intent: string;
  setIntent: (val: string) => void;
  day: string;
  setDay: (val: string) => void;
  month: string;
  setMonth: (val: string) => void;
  year: string;
  setYear: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  saveDraft: (overrides?: Record<string, string>) => void;
  days: string[];
  months: { value: string; label: string }[];
  years: string[];
}

export function RegisterProfileDetails({
  t,
  intent,
  setIntent,
  day,
  setDay,
  month,
  setMonth,
  year,
  setYear,
  gender,
  setGender,
  saveDraft,
  days,
  months,
  years,
}: RegisterProfileDetailsProps) {
  return (
    <div className="space-y-3.5">
      {/* Mục tiêu học tập & Giới tính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mục tiêu học ngôn ngữ */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted ml-1">
            {t("onboarding.intent_label") || "Mục tiêu học tập"}
          </label>
          <select
            className="flex h-12 w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
            value={intent}
            onChange={(e) => {
              setIntent(e.target.value);
              saveDraft({ intent: e.target.value });
            }}
          >
            <option value="Giao tiếp casual">
              {t("onboarding.intent_casual") || "Giao tiếp & Kết bạn (Casual)"}
            </option>
            <option value="Thi cử">
              {t("onboarding.intent_exam") || "Luyện thi chứng chỉ"}
            </option>
            <option value="Du lịch">
              {t("onboarding.intent_travel") || "Du lịch & Trải nghiệm văn hóa"}
            </option>
            <option value="Làm việc">
              {t("onboarding.intent_work") || "Công việc & Định cư"}
            </option>
          </select>
        </div>

        {/* Giới tính */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted ml-1">
            {t("register.gender") || "Giới tính"}
          </label>
          <select
            className="flex h-12 w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              saveDraft({ gender: e.target.value });
            }}
          >
            <option value="">{t("register.gender_placeholder")}</option>
            <option value="female">{t("register.gender_female")}</option>
            <option value="male">{t("register.gender_male")}</option>
            <option value="custom">{t("register.gender_custom")}</option>
          </select>
        </div>
      </div>

      {/* Ngày sinh (Full Width với 3 cột rộng rãi) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">
          {t("register.dob") || "Ngày sinh"}
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Ngày */}
          <select
            className="flex h-12 w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-medium text-foreground transition-all"
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              saveDraft({ day: e.target.value });
            }}
          >
            <option value="">{t("register.day") || "Ngày"}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Tháng */}
          <select
            className="flex h-12 w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-medium text-foreground transition-all truncate"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              saveDraft({ month: e.target.value });
            }}
          >
            <option value="">{t("register.month") || "Tháng"}</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Năm */}
          <select
            className="flex h-12 w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 font-medium text-foreground transition-all"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              saveDraft({ year: e.target.value });
            }}
          >
            <option value="">{t("register.year") || "Năm"}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
