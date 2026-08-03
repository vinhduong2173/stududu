"use client";

import * as React from "react";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";

const ENGLISH_COUNTRIES = ["US", "GB", "AU", "CA", "NZ", "IE", "SG", "ZA"];

const COUNTRIES = [
  { code: "VN", flag: "🇻🇳", nameVi: "Việt Nam", nameEn: "Vietnam" },
  { code: "US", flag: "🇺🇸", nameVi: "Mỹ (United States)", nameEn: "United States" },
  { code: "GB", flag: "🇬🇧", nameVi: "Vương quốc Anh (UK)", nameEn: "United Kingdom" },
  { code: "AU", flag: "🇦🇺", nameVi: "Úc (Australia)", nameEn: "Australia" },
  { code: "CA", flag: "🇨🇦", nameVi: "Canada", nameEn: "Canada" },
  { code: "NZ", flag: "🇳🇿", nameVi: "New Zealand", nameEn: "New Zealand" },
  { code: "JP", flag: "🇯🇵", nameVi: "Nhật Bản", nameEn: "Japan" },
  { code: "KR", flag: "🇰🇷", nameVi: "Hàn Quốc", nameEn: "South Korea" },
  { code: "DE", flag: "🇩🇪", nameVi: "Đức", nameEn: "Germany" },
  { code: "FR", flag: "🇫🇷", nameVi: "Pháp", nameEn: "France" },
  { code: "CN", flag: "🇨🇳", nameVi: "Trung Quốc", nameEn: "China" },
];

export default function RegisterPage() {
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

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Restore state from sessionStorage if locale switched
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
      ...overrides,
    };
    sessionStorage.setItem("register_form_draft", JSON.stringify(draft));
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    saveDraft({ country: newCountry });

    let targetLocale = locale;
    if (ENGLISH_COUNTRIES.includes(newCountry)) {
      targetLocale = "en";
    } else if (newCountry === "VN") {
      targetLocale = "vi";
    }

    if (targetLocale !== locale) {
      startTransition(() => {
        router.replace(pathname, { locale: targetLocale });
      });
    }
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
        },
      });
      
      sessionStorage.removeItem("register_form_draft");
      localStorage.setItem("accessToken", res.tokens.accessToken);
      localStorage.setItem("refreshToken", res.tokens.refreshToken);
      router.push("/onboarding");
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
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <div className="flex min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      {/* Cột minh hoạ (chỉ hiện trên desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 text-white flex-col justify-center">
        <h1 className="text-5xl font-bold mb-6">{t("register.hero_title")}</h1>
        <p className="text-xl opacity-90">{t("register.hero_subtitle")}</p>
      </div>

      {/* Cột form đăng ký kiểu Facebook */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">{t("register.title")}</h1>
            <p className="mt-1 text-muted text-sm">{t("register.subtitle")}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-error/10 p-4 text-sm text-error">
              {error}
            </div>
          )}

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
                    {c.flag} {locale === "en" ? c.nameEn : c.nameVi}
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
                    <option key={m} value={m}>
                      {t("register.month")} {m}
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

            {/* Email hoặc số điện thoại */}
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

            <Button type="submit" disabled={loading || isPending} className="mt-2 text-base">
              {loading ? t("register.submitting") : t("register.submit")}
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted">{t("common.or")}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleGoogleClick}
            className="mt-6 w-full flex items-center justify-center gap-3 py-5 rounded-xl border border-border hover:bg-muted/10 transition-all font-medium text-foreground text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {t("register.google")}
          </Button>

          <div className="mt-6 text-center text-sm text-muted">
            {t("register.has_account")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("register.login_link")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
