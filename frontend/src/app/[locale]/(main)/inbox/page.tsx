"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { BookOpen } from "lucide-react";
import { ReportDialog, BlockDialog } from "@/components/features/TrustDialogs";
import { WordSaveModal } from "@/components/features/WordSaveModal";
import { TranslationModal } from "@/components/features/TranslationModal";
import { ScheduleChatModal } from "@/components/features/ScheduleChatModal";
import { CancelScheduleModal } from "@/components/features/CancelScheduleModal";
import { QuizShareModal } from "@/components/features/QuizShareModal";
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
  const [quizShareOpen, setQuizShareOpen] = React.useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background max-w-7xl mx-auto border-x border-border overflow-hidden">
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
              onMouseUp={c.handleTextSelection}
              className="flex-1 overflow-y-auto p-4 relative"
            >
              {/* Nút lưu từ nổi khi bôi đen text */}
              {c.selectionSave && (
                <div
                  style={{ top: `${c.selectionSave.top}px`, left: `${c.selectionSave.left}px` }}
                  className="absolute z-30 animate-in fade-in zoom-in-95 duration-150"
                >
                  <Button
                    size="sm"
                    className="sd-btn-gradient shadow-xl text-xs gap-1.5 rounded-full py-1.5 px-3"
                    onClick={() => {
                      c.setWordSaveTarget(c.selectionSave!.text);
                      c.setSelectionSave(null);
                    }}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Lưu từ &quot;{c.selectionSave.text.length > 15 ? c.selectionSave.text.slice(0, 15) + "..." : c.selectionSave.text}&quot;
                  </Button>
                </div>
              )}

              {c.loadingMessages ? (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  {c.t("chat.loading_messages")}
                </div>
              ) : c.messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-8 text-muted">
                  <p className="font-bold text-foreground mb-1">
                    {c.t("chat.start_conversation", { name: c.selected.partner.displayName })}
                  </p>
                  <p className="text-xs">{c.t("chat.say_hi")}</p>
                </div>
              ) : (
                c.messages.map((m) => (
                  <MessageBubbleItem
                    key={m.id}
                    t={c.t}
                    m={m}
                    meId={c.me?.id ?? 0}
                    partnerName={c.selected!.partner.displayName}
                    myTimezone={c.me?.timezone}
                    partnerTimezone={c.selected!.partner.timezone}
                    handleTranslate={c.handleTranslate}
                    showTranslationFor={c.showTranslationFor}
                    translations={c.translations}
                    translating={c.translating}
                    setWordSaveTarget={c.setWordSaveTarget}
                    reactionPickerFor={c.reactionPickerFor}
                    setReactionPickerFor={c.setReactionPickerFor}
                    handleToggleReaction={c.handleToggleReaction}
                    respondScheduleRequest={c.respondScheduleRequest}
                    openCancelDialog={c.openCancelDialog}
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
              onOpenQuizShare={() => setQuizShareOpen(true)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="font-bold text-foreground text-lg mb-1">{c.t("chat.select_chat_title")}</h3>
            <p className="text-xs max-w-sm">{c.t("chat.select_chat_subtitle")}</p>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      {quizShareOpen && c.selected && (
        <QuizShareModal
          open={quizShareOpen}
          onClose={() => setQuizShareOpen(false)}
          partnerName={c.selected.partner.displayName}
          onSendQuiz={(quiz) => {
            c.sendMessage(`🧠 [QUIZ] ${quiz.title}`, "text", {
              quizId: quiz.id,
              quizTitle: quiz.title,
              level: quiz.level,
              questionCount: quiz.questionCount,
            } as any);
          }}
        />
      )}

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

      {c.wordSaveTarget && (
        <WordSaveModal
          open={!!c.wordSaveTarget}
          onClose={() => c.setWordSaveTarget(null)}
          initialWord={c.wordSaveTarget}
          source="chat"
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
