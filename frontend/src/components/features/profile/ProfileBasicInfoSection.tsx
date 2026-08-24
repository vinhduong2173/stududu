"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { COUNTRIES } from "@/hooks/useRegister";

interface ProfileBasicInfoSectionProps {
  t: any;
  tOnboard: any;
  tRoot?: any;
  displayName: string;
  setDisplayName: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
}

export function ProfileBasicInfoSection({
  t,
  tOnboard,
  tRoot,
  displayName,
  setDisplayName,
  city,
  setCity,
  country,
  setCountry,
  dob,
  setDob,
  gender,
  setGender,
  bio,
  setBio,
}: ProfileBasicInfoSectionProps) {
  const selectClass =
    "flex h-12 rounded-xl border border-border bg-transparent px-4 py-2 outline-none focus:border-primary font-medium text-foreground";
  const fieldLabel = "block text-xs font-semibold text-muted uppercase tracking-wide mb-2";

  return (
    <>
      {/* Thông tin cơ bản */}
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("basic_info")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>{t("display_name")}</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div>
            <label className={fieldLabel}>{tRoot?.("register.country") || "Quốc gia / Quê quán"}</label>
            <select
              className={`${selectClass} w-full`}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">{tRoot?.("register.country") || "Chọn quốc gia"}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabel}>{t("city")}</label>
            <Input placeholder={t("city_placeholder")} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <label className={fieldLabel}>{t("dob")}</label>
            <input
              type="date"
              className={`${selectClass} w-full`}
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabel}>{t("gender")}</label>
            <select className={`${selectClass} w-full`} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t("gender_private")}</option>
              <option value="male">{t("gender_male") || "Nam"}</option>
              <option value="female">{t("gender_female") || "Nữ"}</option>
              <option value="other">{t("gender_other") || "Khác"}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Giới thiệu (Bio) */}
      <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-foreground">{tOnboard("bio_label")}</h2>
          <span className="text-xs text-muted">{bio.length}/300</span>
        </div>
        <textarea
          className="w-full rounded-xl border border-border bg-transparent p-4 outline-none focus:border-primary resize-none h-32"
          placeholder={tOnboard("bio_placeholder")}
          maxLength={300}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </section>
    </>
  );
}
