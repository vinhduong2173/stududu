"use client";

import * as React from "react";

/** i18n UI chrome (vi/en) — CHỈ dịch nút/nhãn/thông báo hệ thống.
 *  KHÔNG dịch nội dung user tạo (bio, tin nhắn, từ đã lưu, definition…).
 *  Locale lưu ở localStorage (không cần bảng mới), mặc định theo trình duyệt. */

export type Locale = "vi" | "en";

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  vi: {
    "nav.discover": "Khám phá",
    "nav.messages": "Tin nhắn",
    "nav.vocabulary": "Từ vựng",
    "nav.community": "Cộng đồng",
    "nav.profile": "Hồ sơ",
    "menu.profile": "Hồ sơ",
    "menu.settings": "Cài đặt",
    "menu.admin": "Trang quản trị",
    "menu.logout": "Đăng xuất",
    "settings.title": "Cài đặt",
    "settings.language": "Ngôn ngữ giao diện",
    "settings.language.hint": "Chỉ áp dụng cho giao diện — nội dung của thành viên giữ nguyên ngôn ngữ gốc.",
    "settings.password": "Đổi mật khẩu",
    "settings.password.hint": "Tối thiểu 8 ký tự, gồm cả chữ và số.",
    "settings.password.current": "Mật khẩu hiện tại",
    "settings.password.new": "Mật khẩu mới",
    "settings.password.confirm": "Xác nhận mật khẩu mới",
    "settings.password.updating": "Đang cập nhật...",
    "settings.password.update": "Cập nhật mật khẩu",
    "settings.shareActivity": "Chia sẻ hoạt động",
    "settings.shareActivity.hint": "Tự động đăng lên Cộng đồng khi bạn góp từ vào thư viện chung hoặc đạt mốc giờ luyện tập.",
    "settings.shareActivity.on": "Đang bật",
    "settings.shareActivity.off": "Đang tắt",
    "settings.blocked": "Danh sách đã chặn",
    "settings.blocked.empty": "Bạn chưa chặn ai.",
    "settings.blocked.unblock": "Bỏ chặn",
    "settings.shareActivity.enabled": "Đã bật chia sẻ hoạt động",
    "settings.shareActivity.disabled": "Đã tắt chia sẻ hoạt động",
    "settings.password.mismatch": "Xác nhận mật khẩu không khớp.",
    "settings.password.success": "Đã cập nhật mật khẩu",
    "settings.blocked.unblockSuccess": "Đã bỏ chặn",
    "common.save": "Lưu thay đổi",
    "common.cancel": "Hủy",
    "common.loading": "Đang tải...",
  },
  en: {
    "nav.discover": "Discover",
    "nav.messages": "Messages",
    "nav.vocabulary": "Vocabulary",
    "nav.community": "Community",
    "nav.profile": "Profile",
    "menu.profile": "Profile",
    "menu.settings": "Settings",
    "menu.admin": "Admin panel",
    "menu.logout": "Log out",
    "settings.title": "Settings",
    "settings.language": "Interface language",
    "settings.language.hint": "UI chrome only — user-generated content stays in its original language.",
    "settings.password": "Change password",
    "settings.password.hint": "At least 8 characters, including letters and numbers.",
    "settings.password.current": "Current password",
    "settings.password.new": "New password",
    "settings.password.confirm": "Confirm new password",
    "settings.password.updating": "Updating...",
    "settings.password.update": "Update password",
    "settings.shareActivity": "Share activity",
    "settings.shareActivity.hint": "Automatically post to Community when you contribute words or reach learning milestones.",
    "settings.shareActivity.on": "Enabled",
    "settings.shareActivity.off": "Disabled",
    "settings.blocked": "Blocked users",
    "settings.blocked.empty": "You haven't blocked anyone.",
    "settings.blocked.unblock": "Unblock",
    "settings.shareActivity.enabled": "Activity sharing enabled",
    "settings.shareActivity.disabled": "Activity sharing disabled",
    "settings.password.mismatch": "Confirm password does not match.",
    "settings.password.success": "Password updated successfully",
    "settings.blocked.unblockSuccess": "Unblocked",
    "common.save": "Save changes",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
  },
};

const LocaleContext = React.createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({ locale: "vi", setLocale: () => undefined, t: (k) => k });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("vi");

  React.useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "vi" || stored === "en") {
      setLocaleState(stored);
    } else if (typeof navigator !== "undefined" && !navigator.language.startsWith("vi")) {
      setLocaleState("en"); // mặc định theo browser
    }
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = React.useCallback(
    (key: string) => DICTIONARIES[locale][key] ?? DICTIONARIES.vi[key] ?? key,
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return React.useContext(LocaleContext);
}
