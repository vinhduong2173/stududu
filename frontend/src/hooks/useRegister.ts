"use client";

import * as React from "react";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";

export const ENGLISH_COUNTRIES = ["US", "GB", "AU", "CA", "NZ", "IE", "SG", "ZA"];

export const COUNTRIES = [
  { code: "VN", flag: "🇻🇳", label: "Việt Nam (Vietnam)" },
  { code: "US", flag: "🇺🇸", label: "United States (English)" },
  { code: "GB", flag: "🇬🇧", label: "United Kingdom (English)" },
  { code: "AU", flag: "🇦🇺", label: "Australia (English)" },
  { code: "CA", flag: "🇨🇦", label: "Canada (English)" },
  { code: "NZ", flag: "🇳🇿", label: "New Zealand (English)" },
  { code: "FR", flag: "🇫🇷", label: "France (Français)" },
  { code: "JP", flag: "🇯🇵", label: "日本 (Japan)" },
  { code: "KR", flag: "🇰🇷", label: "대한민국 (South Korea)" },
  { code: "DE", flag: "🇩🇪", label: "Deutschland (Germany)" },
  { code: "CN", flag: "🇨🇳", label: "中国 (China)" },
  { code: "ES", flag: "🇪🇸", label: "España (Spain)" },
  { code: "IT", flag: "🇮🇹", label: "Italia (Italy)" },
  { code: "RU", flag: "🇷🇺", label: "Россия (Russia)" },
  { code: "TH", flag: "🇹🇭", label: "ประเทศไทย (Thailand)" },
];

export function useRegister() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [day, setDay] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [year, setYear] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [country, setCountry] = React.useState("VN");
  const [city, setCity] = React.useState("");
  const [intent, setIntent] = React.useState("Giao tiếp casual");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const saved = sessionStorage.getItem("register_form_draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.email) setEmail(data.email);
        if (data.day) setDay(data.day);
        if (data.month) setMonth(data.month);
        if (data.year) setYear(data.year);
        if (data.gender) setGender(data.gender);
        if (data.country) setCountry(data.country);
        if (data.city) setCity(data.city);
        if (data.intent) setIntent(data.intent);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveDraft = (overrides?: Record<string, string>) => {
    const draft = {
      firstName,
      lastName,
      email,
      day,
      month,
      year,
      gender,
      country,
      city,
      intent,
      ...overrides,
    };
    sessionStorage.setItem("register_form_draft", JSON.stringify(draft));
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    saveDraft({ country: newCountry });
  };

  const handleGoogleClick = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("register.password_error"));
      return;
    }

    setLoading(true);
    setError("");

    let dob: string | undefined = undefined;
    if (day && month && year) {
      dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const displayName = [lastName, firstName].filter(Boolean).join(" ") || email.split("@")[0];

    try {
      const res = await api<{ user: any; tokens: { accessToken: string; refreshToken: string } }>("/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          displayName,
          firstName,
          lastName,
          dob,
          gender,
          country,
          city: city.trim() || undefined,
          intent: intent || undefined,
        },
      });

      sessionStorage.removeItem("register_form_draft");
      localStorage.setItem("accessToken", res.tokens.accessToken);
      localStorage.setItem("refreshToken", res.tokens.refreshToken);

      let targetLocale = locale;
      if (ENGLISH_COUNTRIES.includes(country)) {
        targetLocale = "en";
      } else if (country === "VN") {
        targetLocale = "vi";
      } else if (country === "FR") {
        targetLocale = "fr";
      } else if (country === "ES") {
        targetLocale = "es";
      } else if (country === "CN") {
        targetLocale = "zh";
      }

      document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;
      router.push("/onboarding", { locale: targetLocale });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.error_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 15);
    let label = (i + 1).toString();
    try {
      const raw = new Intl.DateTimeFormat(locale, { month: "long" }).format(d);
      label = raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch (e) {
      // fallback
    }
    return {
      value: (i + 1).toString(),
      label,
    };
  });

  return {
    t,
    locale,
    router,
    isPending,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    day,
    setDay,
    month,
    setMonth,
    year,
    setYear,
    gender,
    setGender,
    country,
    setCountry,
    city,
    setCity,
    intent,
    setIntent,
    loading,
    error,
    saveDraft,
    handleCountryChange,
    handleGoogleClick,
    handleRegister,
    years,
    months,
    days,
  };
}
