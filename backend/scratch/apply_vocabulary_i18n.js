const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend/src/app/[locale]/(main)/vocabulary/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Add t declaration inside VocabularyPage component
code = code.replace(
  `export default function VocabularyPage() {\n  const { show: showToast, toast } = useToast();`,
  `export default function VocabularyPage() {\n  const t = useTranslations("vocabulary");\n  const { show: showToast, toast } = useToast();`
);

// Replace showToast message in handleDeleteWord
code = code.replace(
  `showToast(\`Đã xóa "\${term}" khỏi sổ từ vựng.\`);`,
  `showToast(t("deleted_toast_message", { term }));`
);

// Replace getRankBadge titles
code = code.replace(
  `if (acc >= 90) return { title: "Xuất Sắc! 🌟", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    if (acc >= 70) return { title: "Giỏi! 👏", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (acc >= 50) return { title: "Khá! 👍", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" };
    return { title: "Cần Cố Gắng! 💡", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" };`,
  `if (acc >= 90) return { title: t("rank_excellent"), color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
    if (acc >= 70) return { title: t("rank_good"), color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" };
    if (acc >= 50) return { title: t("rank_fair"), color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" };
    return { title: t("rank_needs_work"), color: "text-rose-500 bg-rose-500/10 border-rose-500/30" };`
);

// Header Section
code = code.replace(`<BookOpen className="w-4 h-4" /> HỌC TỪ VỰNG TRẮC NGHIỆM`, `<BookOpen className="w-4 h-4" /> {t("header_badge")}`);
code = code.replace(`Sổ từ vựng & Quiz`, `{t("page_title")}`);
code = code.replace(`Ôn tập trắc nghiệm nghĩa tiếng Việt và quản lý sổ từ vựng cá nhân của bạn.`, `{t("page_subtitle")}`);
code = code.replace(`<div className="text-[11px] font-semibold text-muted">Tổng từ</div>`, `<div className="text-[11px] font-semibold text-muted">{t("total_words")}</div>`);
code = code.replace(`<div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">\n              Đã thuộc\n            </div>`, `<div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">\n              {t("mastered")}\n            </div>`);
code = code.replace(`<div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">\n              Cần ôn\n            </div>`, `<div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">\n              {t("need_review")}\n            </div>`);

// Main Tabs
code = code.replace(`<Brain className="w-4 h-4" /> 🎯 Ôn Tập Quiz`, `<Brain className="w-4 h-4" /> 🎯 {t("tab_quiz")}`);
code = code.replace(`<BookOpen className="w-4 h-4" /> 📚 Sổ Từ Vựng ({totalCount})`, `<BookOpen className="w-4 h-4" /> 📚 {t("tab_notebook", { count: totalCount })}`);

// Mode Toggle
code = code.replace(`Ôn từ chưa thuộc ({learningCount})`, `{t("btn_review_learning", { count: learningCount })}`);
code = code.replace(`Ôn toàn bộ ({totalCount})`, `{t("btn_review_all", { count: totalCount })}`);
code = code.replace(`Đang tải dữ liệu Quiz...`, `{t("quiz_loading")}`);

// Quiz Completion Card
code = code.replace(`Kết Quả Lượt Quiz`, `{t("quiz_result_title")}`);
code = code.replace(`Bạn đã hoàn thành lượt ôn tập với bộ {totalQuestions} câu hỏi.`, `{t("quiz_result_desc", { count: totalQuestions })}`);
code = code.replace(`<Zap className="w-3.5 h-3.5" /> Tổng Điểm`, `<Zap className="w-3.5 h-3.5" /> {t("total_score")}`);
code = code.replace(`+10 điểm / câu đúng`, `{t("score_sub")}`);
code = code.replace(`<CheckCircle2 className="w-3.5 h-3.5" /> Câu Đúng`, `<CheckCircle2 className="w-3.5 h-3.5" /> {t("correct_answers")}`);
code = code.replace(`Đã chuyển Đã thuộc`, `{t("correct_sub")}`);
code = code.replace(`<Award className="w-3.5 h-3.5" /> Tỷ Lệ Đúng`, `<Award className="w-3.5 h-3.5" /> {t("accuracy_rate")}`);
code = code.replace(`Độ chính xác`, `{t("accuracy")}`);
code = code.replace(`<RotateCw className="w-4 h-4 mr-2" /> Bắt đầu lượt Quiz mới`, `<RotateCw className="w-4 h-4 mr-2" /> {t("btn_new_quiz")}`);
code = code.replace(`<BookOpen className="w-4 h-4 mr-2" /> Xem Sổ Từ Vựng`, `<BookOpen className="w-4 h-4 mr-2" /> {t("btn_view_notebook")}`);

// Active Quiz Question Card
code = code.replace(`Câu {currentIndex + 1} / {deck.length}`, `{t("question_progress", { current: currentIndex + 1, total: deck.length })}`);
code = code.replace(`⚡ {score * 10} điểm`, `⚡ {t("points", { points: score * 10 })}`);
code = code.replace(`🔥 Chuỗi {streak}!`, `🔥 {t("streak", { streak })}`);
code = code.replace(`{activeQuizWord.status === "mastered" ? "Đã thuộc" : "Đang học"}`, `{activeQuizWord.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}`);
code = code.replace(`title="Nghe phát âm"`, `title={t("btn_audio_tooltip")}`);
code = code.replace(`👉 Chọn 1 đáp án nghĩa tiếng Việt đúng nhất ở bên dưới:`, `{t("select_correct_def_prompt")}`);
code = code.replace(`{currentIndex + 1 < deck.length ? "Câu tiếp theo" : "Xem điểm số Quiz"}`, `{currentIndex + 1 < deck.length ? t("btn_next_question") : t("btn_view_score")}`);

// Empty Deck State
code = code.replace(
  `{reviewMode === "learning_only"\n                  ? "Bạn đã thuộc hết các từ cần ôn!"\n                  : "Chưa có từ vựng nào trong sổ!"}`,
  `{reviewMode === "learning_only" ? t("empty_learning_title") : t("empty_notebook_title")}`
);
code = code.replace(
  `{reviewMode === "learning_only"\n                  ? "Tuyệt vời! Bạn có thể chuyển sang chế độ Ôn toàn bộ để củng cố lại kiến thức."\n                  : "Hãy thêm từ mới vào sổ tay bằng cách bôi đen khi dịch hoặc chat nhé."}`,
  `{reviewMode === "learning_only" ? t("empty_learning_desc") : t("empty_notebook_desc")}`
);
code = code.replace(`Ôn toàn bộ từ vựng ({totalCount})`, `{t("btn_review_all_full", { count: totalCount })}`);

// Notebook Tab
code = code.replace(`<h2 className="font-extrabold text-xl text-foreground">Sổ Từ Vựng Cá Nhân</h2>`, `<h2 className="font-extrabold text-xl text-foreground">{t("notebook_heading")}</h2>`);
code = code.replace(`<p className="text-xs text-muted mt-0.5">Danh sách toàn bộ các từ đã lưu, bôi đen dịch hoặc học trong chat.</p>`, `<p className="text-xs text-muted mt-0.5">{t("notebook_subheading")}</p>`);
code = code.replace(`Tổng số: {filteredWords.length} từ`, `{t("total_count_label", { count: filteredWords.length })}`);

code = code.replace(`{filterKey === "all" && "Tất cả"}`, `{filterKey === "all" && t("filter_all")}`);
code = code.replace(`{filterKey === "new" && "Mới"}`, `{filterKey === "new" && t("filter_new")}`);
code = code.replace(`{filterKey === "learning" && "Đang học"}`, `{filterKey === "learning" && t("filter_learning")}`);
code = code.replace(`{filterKey === "mastered" && "Đã thuộc"}`, `{filterKey === "mastered" && t("filter_mastered")}`);

code = code.replace(`placeholder="Tìm kiếm từ vựng..."`, `placeholder={t("search_placeholder_notebook")}`);
code = code.replace(`{item.status === "mastered" ? "Đã thuộc" : "Đang học"}`, `{item.status === "mastered" ? t("status_mastered_label") : t("status_learning_label")}`);

code = code.replace(
  `Nguồn:{" "}\n                          {item.source === "chat"\n                            ? "Chat · Sarah"\n                            : item.source === "manual"\n                            ? "Sổ tay"\n                            : "Cộng đồng"}`,
  `{t("source_prefix", { source: item.source === "chat" ? t("source_chat_label") : item.source === "manual" ? t("source_manual_label") : t("source_community_label") })}`
);

code = code.replace(`title="Xóa từ"`, `title={t("btn_delete_tooltip")}`);
code = code.replace(`Chưa tìm thấy từ vựng nào phù hợp trong sổ tay.`, `{t("no_words_found")}`);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully applied i18n to vocabulary/page.tsx!');
