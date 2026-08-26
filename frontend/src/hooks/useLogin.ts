"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";

export function useLogin() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      setPassword(savedPassword ?? "");
      setRemember(true);
    }
  }, []);

  const handleGoogleClick = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api<{ user: any; tokens: { accessToken: string; refreshToken: string } }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      localStorage.setItem("accessToken", res.tokens.accessToken);
      localStorage.setItem("refreshToken", res.tokens.refreshToken);
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      if (remember) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      const me = await api<{ languages: any[]; role: string }>("/users/me", { token: res.tokens.accessToken });
      const supportedLocales = ["en", "vi", "fr", "es", "zh"];
      const nativeLangItem = me.languages?.find((l: any) => l.role === "native" || l.role === "fluent");
      const userLangCode = nativeLangItem?.language?.code?.toLowerCase() || "";
      const targetLocale = supportedLocales.includes(userLangCode) ? userLangCode : locale;

      document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;
      if (remember) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      if (me.role === 'admin') {
        router.push("/admin", { locale: targetLocale });
      } else {
        router.push(me.languages.length === 0 ? "/onboarding" : "/discover", { locale: targetLocale });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError(t("common.error_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    t,
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    loading,
    error,
    handleGoogleClick,
    handleLogin,
  };
}
