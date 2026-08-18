"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COUNTRIES } from "@/hooks/useRegister";

interface RegisterFormFieldsProps {
  t: any;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  country: string;
  handleCountryChange: (country: string) => void;
  day: string;
  setDay: (val: string) => void;
  month: string;
  setMonth: (val: string) => void;
  year: string;
  setYear: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  saveDraft: (overrides?: Record<string, string>) => void;
  handleRegister: (e: React.FormEvent) => void;
  loading: boolean;
  isPending: boolean;
  days: string[];
  months: { value: string; label: string }[];
  years: string[];
}

export function RegisterFormFields({
  t,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  country,
  handleCountryChange,
  day,
  setDay,
  month,
  setMonth,
  year,
  setYear,
  gender,
  setGender,
  email,
  setEmail,
  password,
  setPassword,
  saveDraft,
  handleRegister,
  loading,
  isPending,
  days,
  months,
  years,
}: RegisterFormFieldsProps) {
  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      {/* Họ & Tên */}
      <div className="flex gap-3">
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
        <Input
          type="text"
          placeholder={t("register.surname")}
          required
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            saveDraft({ lastName: e.target.value });
          }}
        />
      </div>

      {/* Chọn Quốc gia */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">{t("register.country")}</label>
        <select
          className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary font-medium text-foreground"
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

      {/* Ngày tháng năm sinh */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">{t("register.dob")}</label>
        <div className="grid grid-cols-3 gap-2">
          <select
            className="flex h-11 rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none focus:border-primary font-medium text-foreground"
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              saveDraft({ day: e.target.value });
            }}
          >
            <option value="">{t("register.day")}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="flex h-11 rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none focus:border-primary font-medium text-foreground"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              saveDraft({ month: e.target.value });
            }}
          >
            <option value="">{t("register.month")}</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="flex h-11 rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none focus:border-primary font-medium text-foreground"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              saveDraft({ year: e.target.value });
            }}
          >
            <option value="">{t("register.year")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Giới tính */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">{t("register.gender")}</label>
        <select
          className="flex h-12 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary font-medium text-foreground"
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

      {/* Email */}
      <Input
        type="email"
        placeholder={t("register.email")}
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          saveDraft({ email: e.target.value });
        }}
      />

      {/* Mật khẩu */}
      <div className="flex flex-col gap-1">
        <Input
          type="password"
          placeholder={t("register.password")}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="text-xs text-muted ml-1">{t("register.password_hint")}</span>
      </div>

      <Button type="submit" disabled={loading || isPending} className="sd-btn-gradient mt-2 h-12 text-sm font-bold rounded-full">
        {loading ? t("register.submitting") : t("register.submit")}
      </Button>
    </form>
  );
}
