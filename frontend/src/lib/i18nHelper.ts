export const getTopicTranslation = (name: string, t: (key: string) => string): string => {
  const map: Record<string, string> = {
    "Du lịch": t("topics.travel"),
    "Âm nhạc": t("topics.music"),
    "Phim ảnh": t("topics.movies"),
    "Ẩm thực": t("topics.food"),
    "Thể thao": t("topics.sports"),
    "Công nghệ": t("topics.tech"),
    "Sách": t("topics.books"),
    "Game": t("topics.game"),
    "Văn hóa": t("topics.culture"),
    "Thi cử (IELTS/TOEIC…)": t("topics.exams"),
    "Thi cử (IELTS/TOEIC...)": t("topics.exams"),
  };
  return map[name] || name;
};

export const getIntentTranslation = (intent: string | null | undefined, t: (key: string) => string): string => {
  if (!intent) return t("profile.not_specified");
  const map: Record<string, string> = {
    "Giao tiếp casual": t("onboarding.intent_casual"),
    "Thi cử": t("onboarding.intent_exam"),
    "Du lịch": t("onboarding.intent_travel"),
    "Làm việc": t("onboarding.intent_work"),
  };
  return map[intent] || intent;
};

export const getGenderTranslation = (gender: string | null | undefined, t: (key: string) => string): string => {
  if (!gender) return t("profile.not_specified");
  const map: Record<string, string> = {
    nam: t("profile.gender_male") || "Nam",
    nữ: t("profile.gender_female") || "Nữ",
    khác: t("profile.gender_other") || "Khác",
  };
  return map[gender.toLowerCase()] || gender;
};
