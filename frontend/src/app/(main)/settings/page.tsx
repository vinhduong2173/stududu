"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { useToast } from "@/components/features/TrustDialogs";
import { ArrowLeft, KeyRound, Languages, LogOut, ShieldBan, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, type Locale } from "@/lib/i18n";

/** Cài đặt (MÀN 12/13): đổi mật khẩu, danh sách đã chặn (US-18 AC3), đăng xuất. */

type BlockItem = {
  id: number;
  blocked: { id: number; displayName: string; avatarUrl?: string | null };
};

export default function SettingsPage() {
  const router = useRouter();
  const { show: showToast, toast } = useToast();
  const { locale, setLocale, t } = useLocale();

  // Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pwError, setPwError] = React.useState("");
  const [pwSaving, setPwSaving] = React.useState(false);

  // Danh sách chặn
  const [blocks, setBlocks] = React.useState<BlockItem[]>([]);
  const [blocksLoading, setBlocksLoading] = React.useState(true);

  // FS-25 — tắt/bật tạo activity post tự động
  const [shareActivity, setShareActivity] = React.useState(true);

  React.useEffect(() => {
    api<BlockItem[]>("/blocks")
      .then(setBlocks)
      .catch(console.error)
      .finally(() => setBlocksLoading(false));
    api<{ shareActivity?: boolean }>("/users/me")
      .then((me) => setShareActivity(me.shareActivity ?? true))
      .catch(console.error);
  }, []);

  const toggleShareActivity = async () => {
    const next = !shareActivity;
    setShareActivity(next);
    try {
      await api("/users/me", { method: "PATCH", body: { shareActivity: next } });
      showToast(next ? "Đã bật chia sẻ hoạt động" : "Đã tắt chia sẻ hoạt động");
    } catch (err) {
      setShareActivity(!next);
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Xác nhận mật khẩu không khớp.");
      return;
    }
    setPwSaving(true);
    try {
      await api("/users/me/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Đã cập nhật mật khẩu");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setPwSaving(false);
    }
  };

  const handleUnblock = async (userId: number, name: string) => {
    try {
      await api(`/blocks/${userId}`, { method: "DELETE" });
      setBlocks((prev) => prev.filter((b) => b.blocked.id !== userId));
      showToast(`Đã bỏ chặn ${name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    disconnectSocket();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
      </div>

      <div className="space-y-6">
        {/* NFR i18n — ngôn ngữ giao diện (vi/en), lưu localStorage */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" /> {t("settings.language")}
          </h2>
          <p className="text-sm text-muted mb-4">{t("settings.language.hint")}</p>
          <div className="flex gap-2">
            {(
              [
                { code: "vi", label: "🇻🇳 Tiếng Việt" },
                { code: "en", label: "🇬🇧 English" },
              ] as { code: Locale; label: string }[]
            ).map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLocale(opt.code)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold border-2 transition-all",
                  locale === opt.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/40",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
        {/* Đổi mật khẩu */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Đổi mật khẩu
          </h2>
          <p className="text-sm text-muted mb-4">Tối thiểu 8 ký tự, gồm cả chữ và số.</p>

          {pwError && <div className="mb-4 rounded-xl bg-error/10 p-3 text-sm text-error">{pwError}</div>}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <Input
              type="password"
              placeholder="Mật khẩu hiện tại"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Mật khẩu mới"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" disabled={pwSaving} className="w-full">
              {pwSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        </section>

        {/* FS-25 — chia sẻ hoạt động lên Cộng đồng */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Chia sẻ hoạt động
          </h2>
          <p className="text-sm text-muted mb-4">
            Tự động đăng lên Cộng đồng khi bạn góp từ vào thư viện chung hoặc đạt mốc giờ luyện tập.
          </p>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={shareActivity}
                onChange={toggleShareActivity}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-11 h-6 rounded-full border-2 transition-all",
                  shareActivity ? "bg-success border-success" : "bg-muted/20 border-border",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    shareActivity && "translate-x-5",
                  )}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-foreground">
              {shareActivity ? "Đang bật" : "Đang tắt"}
            </span>
          </label>
        </section>

        {/* Danh sách đã chặn */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <ShieldBan className="h-5 w-5 text-error" /> Danh sách đã chặn
          </h2>

          {blocksLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-muted">Bạn chưa chặn ai.</p>
          ) : (
            <ul className="space-y-3">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <Avatar
                    src={b.blocked.avatarUrl ?? undefined}
                    fallback={b.blocked.displayName.charAt(0)}
                    size="sm"
                  />
                  <span className="flex-1 font-medium text-foreground truncate">
                    {b.blocked.displayName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblock(b.blocked.id, b.blocked.displayName)}
                  >
                    Bỏ chặn
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Đăng xuất */}
        <section className="bg-surface rounded-3xl p-6 shadow-sm border border-border">
          <Button
            variant="ghost"
            className="w-full text-error border-error/30 hover:bg-error/5 hover:text-error"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
          </Button>
        </section>
      </div>

      {toast}
    </div>
  );
}
