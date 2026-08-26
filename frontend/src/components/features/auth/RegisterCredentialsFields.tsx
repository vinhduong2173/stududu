"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface RegisterCredentialsFieldsProps {
  t: any;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  saveDraft: (overrides?: Record<string, string>) => void;
  loading: boolean;
  isPending: boolean;
}

export function RegisterCredentialsFields({
  t,
  email,
  setEmail,
  password,
  setPassword,
  saveDraft,
  loading,
  isPending,
}: RegisterCredentialsFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Email */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">{t("register.email")}</label>
        <Input
          type="email"
          autoComplete="off"
          placeholder="name@example.com"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            saveDraft({ email: e.target.value });
          }}
        />
      </div>

      {/* Mật khẩu */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted ml-1">{t("register.password")}</label>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t("register.password")}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="text-[11px] text-muted ml-1">{t("register.password_hint")}</span>
      </div>

      <Button
        type="submit"
        disabled={loading || isPending}
        className="sd-btn-gradient w-full mt-2 h-12 text-sm font-bold rounded-full shadow-card active:scale-[0.98] transition-all cursor-pointer"
      >
        {loading ? t("register.submitting") : t("register.submit")}
      </Button>
    </div>
  );
}
