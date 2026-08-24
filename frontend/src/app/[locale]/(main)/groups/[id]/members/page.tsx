"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Search,
  Crown,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserX,
  Loader2,
  Lock,
  Globe,
  Ban,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  VolumeX,
  Volume2,
  Check,
  Sparkles,
  CheckSquare,
  Flag,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { GroupItem } from "@/components/features/GroupModals";
import { useToast } from "@/components/features/TrustDialogs";
import { cn } from "@/lib/utils";

type MemberType = {
  id: number;
  groupId: number;
  userId: number;
  role: "owner" | "admin" | "member";
  status: "active" | "suspended";
  bannedUntil?: string | null;
  mutedUntil?: string | null;
  isPreApproved?: boolean;
  joinedAt: string;
  user: { id: number; displayName: string; avatarUrl?: string | null };
  isCreator: boolean;
};

type GroupReport = {
  id: number;
  reporterId: number;
  reportedId: number;
  reason: string;
  targetType?: string | null;
  targetId?: number | null;
  status: string;
  createdAt: string;
  reporter: { id: number; displayName: string; avatarUrl?: string | null };
  reported: { id: number; displayName: string; avatarUrl?: string | null };
};

export default function GroupMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { show: showToast } = useToast();

  const groupIdOrSlug = (params?.id as string) || "";

  const [group, setGroup] = React.useState<GroupItem | null>(null);
  const [members, setMembers] = React.useState<MemberType[]>([]);
  const [reports, setReports] = React.useState<GroupReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<{ id: number; displayName: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<"all" | "admins" | "members" | "banned" | "reports">("all");

  // Ban Modal state
  const [banTargetMember, setBanTargetMember] = React.useState<MemberType | null>(null);
  const [banning, setBanning] = React.useState(false);

  // Mute Modal state
  const [muteTargetMember, setMuteTargetMember] = React.useState<MemberType | null>(null);
  const [muting, setMuting] = React.useState(false);

  // Report Member Modal state
  const [reportTargetMember, setReportTargetMember] = React.useState<MemberType | null>(null);
  const [reportReason, setReportReason] = React.useState("spam");
  const [customReason, setCustomReason] = React.useState("");
  const [submittingReport, setSubmittingReport] = React.useState(false);

  const handleReportMember = async () => {
    if (!reportTargetMember || !group) return;
    const finalReason = reportReason === "other" ? customReason.trim() : reportReason;
    if (!finalReason) {
      showToast("Vui lòng nhập lý do báo cáo");
      return;
    }
    setSubmittingReport(true);
    try {
      await api(`/groups/${group.id}/members/${reportTargetMember.userId}/report`, {
        method: "POST",
        body: { reason: finalReason },
      });
      showToast("Đã gửi báo cáo thành viên thành công");
      setReportTargetMember(null);
      setCustomReason("");
    } catch (err: any) {
      showToast(err.message || "Không thể gửi báo cáo thành viên");
    } finally {
      setSubmittingReport(false);
    }
  };

  const fetchGroupAndMembers = React.useCallback(async () => {
    if (!groupIdOrSlug) return;
    setLoading(true);
    try {
      const groupRes = await api<GroupItem>(`/groups/${groupIdOrSlug}`);
      setGroup(groupRes);

      try {
        const membersRes = await api<MemberType[]>(`/groups/${groupRes.id}/members`);
        setMembers(membersRes);
      } catch {
        setMembers([]);
      }

      // If admin, fetch reports
      if (
        groupRes.creator.id === currentUser?.id ||
        groupRes.userContext.role === "owner" ||
        groupRes.userContext.role === "admin"
      ) {
        try {
          const reportsRes = await api<GroupReport[]>(`/groups/${groupRes.id}/reports`);
          setReports(reportsRes);
        } catch {
          setReports([]);
        }
      }
    } catch (err: any) {
      console.error("Error loading group members:", err);
      showToast(err?.message || "Không thể tải danh sách thành viên");
    } finally {
      setLoading(false);
    }
  }, [groupIdOrSlug, currentUser?.id]);

  React.useEffect(() => {
    fetchGroupAndMembers();
    api<{ id: number; displayName: string }>("/users/me")
      .then(setCurrentUser)
      .catch(console.error);
  }, [fetchGroupAndMembers]);

  const handleKickMember = async (m: MemberType) => {
    if (!group) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa "${m.user.displayName}" khỏi nhóm?`)) return;

    try {
      await api(`/groups/${group.id}/members/${m.userId}`, { method: "DELETE" });
      showToast(`Đã xóa thành viên ${m.user.displayName} khỏi nhóm`);
      setMembers((prev) => prev.filter((item) => item.userId !== m.userId));
      setGroup((prev) => (prev ? { ...prev, memberCount: Math.max(1, prev.memberCount - 1) } : prev));
    } catch (err: any) {
      showToast(err?.message || "Không thể xóa thành viên");
    }
  };

  const handleToggleAdmin = async (m: MemberType) => {
    if (!group) return;
    const isGranting = m.role !== "admin";
    const actionText = isGranting ? "trao quyền Quản trị viên cho" : "gỡ quyền Quản trị viên của";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} "${m.user.displayName}"?`)) return;

    try {
      const newRole = isGranting ? "admin" : "member";
      await api(`/groups/${group.id}/members/${m.userId}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });
      showToast(`Đã ${actionText} ${m.user.displayName}`);
      setMembers((prev) =>
        prev.map((item) => (item.userId === m.userId ? { ...item, role: newRole } : item))
      );
    } catch (err: any) {
      showToast(err?.message || "Không thể thay đổi quyền quản trị");
    }
  };

  const handleBanMember = async (targetUserId: number, durationDays: number) => {
    if (!group) return;
    setBanning(true);
    try {
      const res = await api<{ message: string }>(`/groups/${group.id}/members/${targetUserId}/ban`, {
        method: "POST",
        body: { durationDays },
      });
      showToast(res.message || "Thao tác thành công");
      setBanTargetMember(null);
      fetchGroupAndMembers();
    } catch (err: any) {
      showToast(err?.message || "Không thể cấm thành viên");
    } finally {
      setBanning(false);
    }
  };

  const handleMuteMember = async (targetUserId: number, durationDays: number) => {
    if (!group) return;
    setMuting(true);
    try {
      const res = await api<{ message: string }>(`/groups/${group.id}/members/${targetUserId}/mute`, {
        method: "POST",
        body: { durationDays },
      });
      showToast(res.message || "Thao tác thành công");
      setMuteTargetMember(null);
      fetchGroupAndMembers();
    } catch (err: any) {
      showToast(err?.message || "Không thể cấm đăng bài");
    } finally {
      setMuting(false);
    }
  };

  const handleTogglePreApproval = async (m: MemberType) => {
    if (!group) return;
    const newValue = !m.isPreApproved;
    try {
      const res = await api<{ message: string }>(`/groups/${group.id}/members/${m.userId}/pre-approve`, {
        method: "PATCH",
        body: { isPreApproved: newValue },
      });
      showToast(res.message);
      setMembers((prev) =>
        prev.map((item) => (item.userId === m.userId ? { ...item, isPreApproved: newValue } : item))
      );
    } catch (err: any) {
      showToast(err?.message || "Không thể cài đặt quyền đăng bài");
    }
  };

  const handleResolveReport = async (reportId: number) => {
    if (!group) return;
    try {
      await api(`/groups/${group.id}/reports/${reportId}/resolve`, { method: "POST" });
      showToast("Đã đánh dấu xử lý báo cáo");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      showToast(err?.message || "Không thể xử lý báo cáo");
    }
  };

  const isOwnerOrCreator =
    currentUser &&
    group &&
    (group.creator.id === currentUser.id || group.userContext.role === "owner");

  const isViewerAdminOrOwner =
    currentUser &&
    group &&
    (group.creator.id === currentUser.id ||
      group.userContext.role === "owner" ||
      group.userContext.role === "admin");

  // Filtered members list
  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      const matchQuery = m.user.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchQuery) return false;

      if (filterTab === "admins") {
        return (m.isCreator || m.role === "admin" || m.role === "owner") && m.status === "active";
      }
      if (filterTab === "members") {
        return !m.isCreator && m.role !== "admin" && m.role !== "owner" && m.status === "active";
      }
      if (filterTab === "banned") {
        return m.status === "suspended";
      }
      return m.status === "active";
    });
  }, [members, searchQuery, filterTab]);

  const adminsList = React.useMemo(() => {
    return members.filter((m) => (m.isCreator || m.role === "admin" || m.role === "owner") && m.status === "active");
  }, [members]);

  const bannedList = React.useMemo(() => {
    return members.filter((m) => m.status === "suspended");
  }, [members]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border/80 px-4 py-3 shadow-xs">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/groups/${group?.slug || group?.id || groupIdOrSlug}`)}
              className="rounded-2xl hover:bg-muted/20 gap-2 text-foreground font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang nhóm</span>
            </Button>
          </div>

          {group && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted hidden sm:inline">Quản lý thành viên & Báo cáo</span>
              <span className="text-xs font-bold text-foreground px-3 py-1 rounded-full bg-muted/20 border border-border/40">
                {group.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted">Đang tải thông tin quản lý nhóm...</p>
        </div>
      ) : group ? (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 pt-6 space-y-6">
          {/* Header Banner Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
              <div className="flex items-center gap-4">
                <Avatar
                  src={group.avatarUrl ?? undefined}
                  fallback={group.name.charAt(0).toUpperCase()}
                  size="xl"
                  className="rounded-2xl ring-4 ring-background shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                      {group.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {group.privacy === "private" ? (
                        <>
                          <Lock className="w-3 h-3" /> Riêng tư
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3" /> Công khai
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{group.memberCount} thành viên</span>
                    {bannedList.length > 0 && (
                      <span className="text-rose-500 font-semibold">• {bannedList.length} bị cấm (BAN)</span>
                    )}
                  </p>
                </div>
              </div>

              <Link href={`/groups/${group.slug || group.id}`}>
                <Button variant="outline" className="rounded-2xl text-xs font-bold gap-2">
                  <span>Xem thông tin nhóm</span>
                </Button>
              </Link>
            </div>

            {/* Search & Filter Bar */}
            <div className="pt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 bg-muted/10 p-1.5 rounded-2xl border border-border/60 overflow-x-auto">
                <button
                  onClick={() => setFilterTab("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap",
                    filterTab === "all"
                      ? "bg-surface text-primary shadow-xs border border-border/60"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  Tất cả ({members.filter((m) => m.status === "active").length})
                </button>
                <button
                  onClick={() => setFilterTab("admins")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5",
                    filterTab === "admins"
                      ? "bg-surface text-primary shadow-xs border border-border/60"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Ban quản trị ({adminsList.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab("members")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap",
                    filterTab === "members"
                      ? "bg-surface text-primary shadow-xs border border-border/60"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  Thành viên thường ({members.filter((m) => !m.isCreator && m.role !== "admin" && m.role !== "owner" && m.status === "active").length})
                </button>

                {isViewerAdminOrOwner && (
                  <>
                    <button
                      onClick={() => setFilterTab("banned")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5",
                        filterTab === "banned"
                          ? "bg-surface text-rose-500 shadow-xs border border-rose-500/30"
                          : "text-rose-500/80 hover:text-rose-500"
                      )}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Đang bị BAN ({bannedList.length})</span>
                    </button>

                    <button
                      onClick={() => setFilterTab("reports")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5",
                        filterTab === "reports"
                          ? "bg-surface text-amber-500 shadow-xs border border-amber-500/30"
                          : "text-amber-500/80 hover:text-amber-500"
                      )}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Báo cáo vi phạm ({reports.length})</span>
                    </button>
                  </>
                )}
              </div>

              {/* Search Bar */}
              {filterTab !== "reports" && (
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm thành viên theo tên..."
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-muted/10 text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab Content Rendering */}
          {filterTab === "reports" ? (
            /* Reports View for Admins */
            <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Danh sách Báo cáo Vi phạm</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                    {reports.length}
                  </span>
                </h2>
                <p className="text-xs text-muted">Nhận báo cáo trực tiếp khi bài viết hoặc thành viên có hành vi không phù hợp</p>
              </div>

              {reports.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-emerald-600">Không có báo cáo vi phạm nào!</p>
                  <p className="text-xs text-muted">Nhóm của bạn hoạt động lành mạnh và tuân thủ quy định.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-5 rounded-2xl bg-muted/10 border border-amber-500/20 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={rep.reporter.avatarUrl ?? undefined}
                            fallback={rep.reporter.displayName.charAt(0)}
                            size="md"
                          />
                          <div>
                            <p className="text-xs text-muted">
                              Người báo cáo:{" "}
                              <Link href={`/profile/${rep.reporter.id}`} className="font-bold text-foreground hover:underline">
                                {rep.reporter.displayName}
                              </Link>
                            </p>
                            <p className="text-xs text-muted">
                              Đối tượng bị báo cáo:{" "}
                              <Link href={`/profile/${rep.reported.id}`} className="font-bold text-rose-500 hover:underline">
                                {rep.reported.displayName}
                              </Link>
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] text-muted">{new Date(rep.createdAt).toLocaleString("vi-VN")}</span>
                      </div>

                      <div className="bg-background/80 p-3 rounded-xl border border-border/60 text-xs text-foreground space-y-1">
                        <p className="font-bold text-amber-600">Lý do báo cáo:</p>
                        <p className="text-foreground/90">"{rep.reason}"</p>
                        {rep.targetType === "post" && (
                          <p className="text-[11px] text-muted pt-1">Loại: Báo cáo bài viết (ID: #{rep.targetId})</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 justify-end pt-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const memberToMute = members.find((m) => m.userId === rep.reported.id);
                            if (memberToMute) {
                              setMuteTargetMember(memberToMute);
                            } else {
                              showToast("Thành viên này hiện không còn trong nhóm");
                            }
                          }}
                          className="rounded-xl text-xs font-semibold h-8 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Cấm đăng bài</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const memberToBan = members.find((m) => m.userId === rep.reported.id);
                            if (memberToBan) {
                              setBanTargetMember(memberToBan);
                            } else {
                              showToast("Thành viên này hiện không còn trong danh sách");
                            }
                          }}
                          className="rounded-xl text-xs font-semibold h-8 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Ban thành viên</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleResolveReport(rep.id)}
                          className="sd-btn-gradient rounded-xl text-xs font-semibold h-8 gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã xử lý</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Members View Container */
            <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>
                    {filterTab === "admins"
                      ? "Ban quản trị & Người tạo nhóm"
                      : filterTab === "members"
                      ? "Danh sách thành viên thường"
                      : filterTab === "banned"
                      ? "Thành viên đang bị cấm (BAN)"
                      : "Tất cả thành viên trong nhóm"}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {filteredMembers.length}
                  </span>
                </h2>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-muted">Không tìm thấy thành viên phù hợp</p>
                  <p className="text-xs text-muted/80">Thử tìm kiếm với từ khóa khác hoặc chuyển tab lọc.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((m) => {
                    const canToggleAdmin =
                      isOwnerOrCreator && m.userId !== currentUser?.id && !m.isCreator && m.status === "active";

                    const canBan =
                      isViewerAdminOrOwner && m.userId !== currentUser?.id && !m.isCreator;

                    const canMute =
                      isViewerAdminOrOwner && m.userId !== currentUser?.id && !m.isCreator && m.status === "active";

                    const canSetPreApprove =
                      isViewerAdminOrOwner && m.userId !== currentUser?.id && !m.isCreator && m.status === "active";

                    const isMuted = m.mutedUntil && new Date(m.mutedUntil) > new Date();

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "p-4 rounded-2xl border transition-colors flex items-center justify-between gap-3 group",
                          m.status === "suspended"
                            ? "bg-rose-500/5 border-rose-500/30"
                            : "bg-muted/10 border-border/60 hover:border-primary/40"
                        )}
                      >
                        <Link href={`/profile/${m.user.id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                          <Avatar
                            src={m.user.avatarUrl ?? undefined}
                            fallback={m.user.displayName.charAt(0)}
                            size="lg"
                            className="ring-2 ring-border group-hover:ring-primary/50 transition-all shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                              <span>{m.user.displayName}</span>
                              {currentUser?.id === m.userId && (
                                <span className="text-xs text-muted font-normal">(Bạn)</span>
                              )}
                            </p>

                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {m.status === "suspended" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
                                  <Ban className="w-3.5 h-3.5" />
                                  {m.bannedUntil
                                    ? `BAN đến ${new Date(m.bannedUntil).toLocaleDateString("vi-VN")}`
                                    : "BAN vĩnh viễn"}
                                </span>
                              ) : m.isCreator ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  <Crown className="w-3.5 h-3.5" /> Người tạo nhóm
                                </span>
                              ) : m.role === "admin" || m.role === "owner" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                  <Shield className="w-3.5 h-3.5" /> Quản trị viên
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted/20 text-muted border border-border/40">
                                  Thành viên
                                </span>
                              )}

                              {isMuted && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                  <VolumeX className="w-3 h-3" /> Cấm đăng bài
                                </span>
                              )}

                              {m.isPreApproved && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                                  <Sparkles className="w-3 h-3" /> Đăng bài tự do
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-muted mt-1">
                              Tham gia {new Date(m.joinedAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </Link>

                        {/* Admin Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {/* Cho phép đăng bài không kiểm duyệt */}
                          {canSetPreApprove && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTogglePreApproval(m)}
                              className={cn(
                                "rounded-xl text-xs font-semibold h-8 gap-1",
                                m.isPreApproved
                                  ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                  : "text-muted border-border/60 hover:bg-muted/10"
                              )}
                              title={m.isPreApproved ? "Hủy bỏ quyền đăng bài tự do" : "Cho phép đăng bài không cần kiểm duyệt"}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">
                                {m.isPreApproved ? "Đã duyệt sẵn" : "Duyệt tự do"}
                              </span>
                            </Button>
                          )}

                          {/* Cấm / Gỡ Cấm Đăng Bài */}
                          {canMute && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (isMuted) {
                                  handleMuteMember(m.userId, 0); // Unmute
                                } else {
                                  setMuteTargetMember(m); // Open Mute Modal
                                }
                              }}
                              className={cn(
                                "rounded-xl text-xs font-semibold h-8 gap-1.5",
                                isMuted
                                  ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                  : "text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                              )}
                              title={isMuted ? "Gỡ cấm đăng bài" : "Cấm đăng bài"}
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {isMuted ? "Mở bài" : "Cấm bài"}
                              </span>
                            </Button>
                          )}

                          {/* Trao/Gỡ quyền Admin */}
                          {canToggleAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAdmin(m)}
                              className={cn(
                                "rounded-xl text-xs font-semibold h-8 gap-1.5",
                                m.role === "admin"
                                  ? "text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                                  : "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              )}
                              title={m.role === "admin" ? "Gỡ quyền Quản trị viên" : "Trao quyền Quản trị viên"}
                            >
                              {m.role === "admin" ? (
                                <>
                                  <ShieldOff className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Gỡ Admin</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Trao Admin</span>
                                </>
                              )}
                            </Button>
                          )}

                          {/* Ban / Unban Button */}
                          {canBan && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (m.status === "suspended") {
                                  handleBanMember(m.userId, 0); // Unban
                                } else {
                                  setBanTargetMember(m); // Open Ban Modal
                                }
                              }}
                              className={cn(
                                "rounded-xl text-xs font-semibold h-8 gap-1.5",
                                m.status === "suspended"
                                  ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                  : "text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                              )}
                              title={m.status === "suspended" ? "Gỡ cấm (Unban)" : "Cấm nhóm (Ban)"}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {m.status === "suspended" ? "Unban" : "Ban"}
                              </span>
                            </Button>
                          )}

                          {/* Báo cáo thành viên */}
                          {m.userId !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReportTargetMember(m)}
                              className="rounded-xl text-xs font-semibold h-8 text-warning border-warning/30 hover:bg-warning/10 gap-1.5"
                              title="Báo cáo thành viên"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Báo cáo</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto p-16 text-center bg-surface rounded-3xl border border-border text-rose-500 font-semibold text-sm">
          Không tìm thấy thông tin nhóm.
        </div>
      )}

      {/* Cấm Đăng Bài (Mute) Modal */}
      {muteTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                <VolumeX className="w-5 h-5 text-amber-500" />
                <span>Cấm đăng bài (Mute Member)</span>
              </h3>
              <button onClick={() => setMuteTargetMember(null)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/10 border border-border/60">
              <Avatar
                src={muteTargetMember.user.avatarUrl ?? undefined}
                fallback={muteTargetMember.user.displayName.charAt(0)}
                size="md"
              />
              <div>
                <p className="text-xs font-bold text-foreground">{muteTargetMember.user.displayName}</p>
                <p className="text-[11px] text-muted">Thành viên vẫn giữ tư cách nhóm nhưng tạm bị khóa quyền đăng bài</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Chọn thời hạn cấm đăng bài:</p>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  disabled={muting}
                  onClick={() => handleMuteMember(muteTargetMember.userId, 1)}
                  className="rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>1 Ngày</span>
                </Button>

                <Button
                  variant="outline"
                  disabled={muting}
                  onClick={() => handleMuteMember(muteTargetMember.userId, 7)}
                  className="rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>7 Ngày</span>
                </Button>

                <Button
                  variant="outline"
                  disabled={muting}
                  onClick={() => handleMuteMember(muteTargetMember.userId, 30)}
                  className="rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>30 Ngày</span>
                </Button>

                <Button
                  disabled={muting}
                  onClick={() => handleMuteMember(muteTargetMember.userId, -1)}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Vĩnh viễn</span>
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setMuteTargetMember(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Group Modal */}
      {banTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                <Ban className="w-5 h-5 text-rose-500" />
                <span>Cấm thành viên khỏi Nhóm (Ban)</span>
              </h3>
              <button onClick={() => setBanTargetMember(null)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/10 border border-border/60">
              <Avatar
                src={banTargetMember.user.avatarUrl ?? undefined}
                fallback={banTargetMember.user.displayName.charAt(0)}
                size="md"
              />
              <div>
                <p className="text-xs font-bold text-foreground">{banTargetMember.user.displayName}</p>
                <p className="text-[11px] text-muted">Chọn thời hạn cấm thành viên hoàn toàn khỏi nhóm</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Chọn thời hạn BAN:</p>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  disabled={banning}
                  onClick={() => handleBanMember(banTargetMember.userId, 1)}
                  className="rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>1 Ngày</span>
                </Button>

                <Button
                  variant="outline"
                  disabled={banning}
                  onClick={() => handleBanMember(banTargetMember.userId, 7)}
                  className="rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>7 Ngày</span>
                </Button>

                <Button
                  variant="outline"
                  disabled={banning}
                  onClick={() => handleBanMember(banTargetMember.userId, 30)}
                  className="rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:border-rose-500 hover:text-rose-500"
                >
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span>30 Ngày</span>
                </Button>

                <Button
                  disabled={banning}
                  onClick={() => handleBanMember(banTargetMember.userId, -1)}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  <span>Vĩnh viễn</span>
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setBanTargetMember(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Member Modal */}
      {reportTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                <Flag className="w-5 h-5 text-warning" />
                <span>Báo cáo thành viên vi phạm</span>
              </h3>
              <button onClick={() => setReportTargetMember(null)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted">
                Thành viên bị báo cáo: <strong className="text-foreground">{reportTargetMember.user.displayName}</strong>
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">Chọn lý do vi phạm:</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/10 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Spam / Quảng cáo rác">Spam / Quảng cáo rác</option>
                  <option value="Quấy rối / Xúc phạm người khác">Quấy rối / Xúc phạm người khác</option>
                  <option value="Ngôn từ thù hận / Vi phạm văn hóa">Ngôn từ thù hận / Vi phạm văn hóa</option>
                  <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
                  <option value="other">Lý do khác...</option>
                </select>
              </div>

              {reportReason === "other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do vi phạm..."
                  rows={3}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/10 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportTargetMember(null)}
                className="rounded-xl text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleReportMember}
                disabled={submittingReport || (reportReason === "other" && !customReason.trim())}
                className="bg-warning hover:bg-warning/90 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                <span>{submittingReport ? "Đang gửi..." : "Gửi báo cáo"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
