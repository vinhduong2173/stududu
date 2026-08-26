"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { COUNTRIES } from "@/hooks/useRegister";

interface RegisterLocationFieldsProps {
  t: any;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  country: string;
  handleCountryChange: (country: string) => void;
  city: string;
  setCity: (val: string) => void;
  saveDraft: (overrides?: Record<string, string>) => void;
  isPending: boolean;
}

export function RegisterLocationFields({
  t,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  country,
  handleCountryChange,
  city,
  setCity,
  saveDraft,
  isPending,
}: RegisterLocationFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Họ & Tên */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted ml-1">{t("register.first_name")}</label>
          <Input
            type="text"
            placeholder={t("register.first_name")}
            required
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              saveDraft({ firstName: e.target.value });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted ml-1">{t("register.last_name") || t("register.surname")}</label>
          <Input
            type="text"
            placeholder={t("register.last_name") || t("register.surname")}
            required
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              saveDraft({ lastName: e.target.value });
            }}
          />
        </div>
      </div>

      {/* Quốc gia / Quê quán & Nơi sinh sống */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted ml-1">
            {t("register.country") || "Quốc gia / Quê quán"}
          </label>
          <select
            className="flex h-12 w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={isPending}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted ml-1">
            {t("profile.lives_in") || "Nơi sinh sống"}
          </label>
          <Input
            type="text"
            placeholder={t("profile.city_placeholder") || "Ví dụ: Hà Nội, Tokyo..."}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              saveDraft({ city: e.target.value });
            }}
          />
        </div>
      </div>
    </div>
  );
}
