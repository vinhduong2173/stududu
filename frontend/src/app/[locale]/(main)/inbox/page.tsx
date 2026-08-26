"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Lightbulb, Search } from "lucide-react";
import { ReportDialog, BlockDialog } from "@/components/features/TrustDialogs";
import { TranslationModal } from "@/components/features/TranslationModal";
import { ScheduleChatModal } from "@/components/features/ScheduleChatModal";
import { CancelScheduleModal } from "@/components/features/CancelScheduleModal";
import { getTimezone } from "@/lib/timezones";
import { useChatInbox } from "@/hooks/useChatInbox";
import { ConversationListSidebar } from "@/components/features/chat/ConversationListSidebar";
import { ChatHeader } from "@/components/features/chat/ChatHeader";
import { MessageBubbleItem } from "@/components/features/chat/MessageBubbleItem";
import { ChatInputBar } from "@/components/features/chat/ChatInputBar";
import { cn } from "@/lib/utils";

export default function InboxPage() {
  return (
    <React.Suspense>
      <InboxContent />
    </React.Suspense>
  );
}

function InboxContent() {
  const c = useChatInbox();

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex bg-background overflow-hidden">
      <ConversationListSidebar
        t={c.t}
        me={c.me}
        conversations={c.conversations}
        selectedId={c.selectedId}
        setSelectedId={c.setSelectedId}
        search={c.search}
        setSearch={c.setSearch}
        loadingList={c.loadingList}
      />

      {/* CHAT AREA CHÍNH */}
      <main
        className={cn(
          "flex-1 flex flex-col bg-background min-w-0",
          !c.selectedId ? "hidden md:flex" : "flex",
        )}
      >
        {c.selected ? (
          <>
            <ChatHeader
              t={c.t}
              selected={c.selected}
              setSelectedId={c.setSelectedId}
              startCall={c.startCall}
              callBusy={c.callBusy}
              setScheduleOpen={c.setScheduleOpen}
              setTranslationOpen={c.setTranslationOpen}
              menuOpen={c.menuOpen}
              setMenuOpen={c.setMenuOpen}
              setReportOpen={c.setReportOpen}
              setBlockOpen={c.setBlockOpen}
            />

            {/* DANH SÁCH TIN NHẮN */}
            <div
              ref={c.messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 relative"
            >
              {c.loadingMessages ? (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  {c.t("chat.loading_messages")}
                </div>
              ) : c.messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mb-3 shadow-2xs">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-foreground text-sm mb-1 font-display">
                    {c.t("chat.start_conversation", { name: c.selected.partner.displayName })}
                  </p>
                  <p className="text-xs text-muted mb-4">{c.t("chat.say_hi")}</p>

                  <div className="w-full space-y-2 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gợi ý câu bắt chuyện:</span>
                    </p>
                    <div className="space-y-1.5">
                      {[
                        `Xin chào ${c.selected.partner.displayName}! Rất vui được kết nối cùng bạn.`,
                        `Hi ${c.selected.partner.displayName}! I would love to practice languages together!`,
                        `Chào bạn! Bạn đang muốn luyện tập ngôn ngữ nào thế?`,
                      ].map((starter, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => c.setDraft(starter)}
                          className="w-full text-left text-xs bg-surface hover:bg-teal-50/70 border border-border/80 hover:border-teal-300 p-2.5 rounded-xl text-foreground font-medium transition-all group flex items-center justify-between"
                        >
                          <span className="truncate">{starter}</span>
                          <span className="text-[10px] text-teal-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">Chọn ↵</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                c.messages.map((m) => (
                  <MessageBubbleItem
                    key={m.id}
                    t={c.t}
                    m={m}
                    meId={c.me?.id ?? 0}
                    partnerName={c.selected!.partner.displayName}
                    handleTranslate={c.handleTranslate}
                    showTranslationFor={c.showTranslationFor}
                    translations={c.translations}
                    translating={c.translating}
                    reactionPickerFor={c.reactionPickerFor}
                    setReactionPickerFor={c.setReactionPickerFor}
                    handleToggleReaction={c.handleToggleReaction}
                    respondScheduleRequest={c.respondScheduleRequest}
                    openCancelDialog={c.openCancelDialog}
                    onReply={c.handleReply}
                    onEdit={c.handleStartEdit}
                    onDelete={c.handleDeleteMessage}
                    onScrollToMessage={c.scrollToMessage}
                    isHighlighted={c.highlightedMsgId === m.id}
                  />
                ))
              )}
              <div ref={c.bottomRef} />
            </div>

            <ChatInputBar
              t={c.t}
              draft={c.draft}
              setDraft={c.setDraft}
              handleSend={c.handleSend}
              handleImageUpload={c.handleImageUpload}
              fileInputRef={c.fileInputRef}
              inputRef={c.inputRef}
              showEmoji={c.showEmoji}
              setShowEmoji={c.setShowEmoji}
              replyingTo={c.replyingTo}
              editingMessage={c.editingMessage}
              onCancelReplyOrEdit={c.handleCancelReplyOrEdit}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mb-3.5 shadow-card">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-foreground text-base md:text-lg mb-1 font-display">
              {c.t("chat.select_chat_title")}
            </h3>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              {c.t("chat.select_chat_subtitle")}
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white sd-btn-gradient px-4 py-2 rounded-full shadow-xs hover:opacity-95 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{c.t("chat.discover_new_partners") || c.t("chat.go_discover")}</span>
            </Link>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      {c.scheduleOpen && c.selected && (
        <ScheduleChatModal
          open={c.scheduleOpen}
          onClose={() => c.setScheduleOpen(false)}
          partnerName={c.selected.partner.displayName}
          partnerFlag={getTimezone(c.selected.partner.timezone ?? "VN").flag}
          partnerOffset={getTimezone(c.selected.partner.timezone ?? "VN").offset}
          myOffset={getTimezone(c.me?.timezone ?? "VN").offset}
          partnerSlotIds={c.selected.partner.availableSlots ?? []}
          onSchedule={c.handleSchedule}
        />
      )}

      {c.translationOpen && (
        <TranslationModal
          open={c.translationOpen}
          onClose={() => c.setTranslationOpen(false)}
          initialText={c.translationInitialText}
        />
      )}

      {c.cancelDialogOpen && (
        <CancelScheduleModal
          open={c.cancelDialogOpen}
          onClose={() => c.setCancelDialogOpen(false)}
          onCancel={c.handleCancelSchedule}
          loading={c.cancellingLoading}
        />
      )}

      {c.reportOpen && c.selected && (
        <ReportDialog
          open={c.reportOpen}
          onClose={() => c.setReportOpen(false)}
          targetId={c.selected.partner.id}
          targetName={c.selected.partner.displayName}
        />
      )}

      {c.blockOpen && c.selected && (
        <BlockDialog
          open={c.blockOpen}
          onClose={() => c.setBlockOpen(false)}
          targetId={c.selected.partner.id}
          targetName={c.selected.partner.displayName}
          onDone={() => {
            c.handleBlock();
          }}
        />
      )}

      {c.toast}
    </div>
  );
}
