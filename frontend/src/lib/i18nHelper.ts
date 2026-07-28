export const getTopicTranslation = (name: string, t: any): string => {
  const map: Record<string, string> = {
    "Travel": t("topics.travel"),
    "Du lịch": t("topics.travel"),
    "Music": t("topics.music"),
    "Âm nhạc": t("topics.music"),
    "Movies": t("topics.movies"),
    "Phim ảnh": t("topics.movies"),
    "Food & Culinary": t("topics.food"),
    "Ẩm thực": t("topics.food"),
    "Sports": t("topics.sports"),
    "Thể thao": t("topics.sports"),
    "Technology": t("topics.tech"),
    "Công nghệ": t("topics.tech"),
    "Books": t("topics.books"),
    "Sách": t("topics.books"),
    "Gaming": t("topics.game"),
    "Game": t("topics.game"),
    "Culture": t("topics.culture"),
    "Văn hóa": t("topics.culture"),
    "Exams (IELTS/TOEIC…)": t("topics.exams"),
    "Thi cử (IELTS/TOEIC…)": t("topics.exams"),
    "Thi cử (IELTS/TOEIC...)": t("topics.exams"),
  };
  return map[name] || name;
};

export const getIntentTranslation = (intent: string | null | undefined, t: any): string => {
  if (!intent) return t("profile.not_specified");
  const map: Record<string, string> = {
    "Casual conversation": t("onboarding.intent_casual"),
    "Giao tiếp casual": t("onboarding.intent_casual"),
    "Exams": t("onboarding.intent_exam"),
    "Thi cử": t("onboarding.intent_exam"),
    "Travel": t("onboarding.intent_travel"),
    "Du lịch": t("onboarding.intent_travel"),
    "Work": t("onboarding.intent_work"),
    "Làm việc": t("onboarding.intent_work"),
  };
  return map[intent] || intent;
};

export const getGenderTranslation = (gender: string | null | undefined, t: any): string => {
  if (!gender) return "";
  const g = gender.toLowerCase().trim();
  const keys: Record<string, string> = {
    male: "gender_male",
    nam: "gender_male",
    female: "gender_female",
    nữ: "gender_female",
    other: "gender_other",
    khác: "gender_other",
  };
  const key = keys[g];
  if (!key) return gender;

  try {
    const val = t(`profile.${key}`);
    if (val && !val.includes("profile.")) return val;
  } catch {}

  try {
    const val = t(key);
    if (val && !val.includes(key)) return val;
  } catch {}

  return g === "male" || g === "nam" ? "Male" : g === "female" || g === "nữ" ? "Female" : "Other";
};

