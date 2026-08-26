import { api } from "./api";

export interface LevelOption {
  value: string;
  label: string;
}

export interface LanguageLevelConfig {
  framework: string;
  levels: LevelOption[];
}

export const LANGUAGE_LEVELS_MAP: Record<string, LanguageLevelConfig> = {
  "Tiếng Anh": {
    framework: "CEFR",
    levels: [
      { value: "A1", label: "A1 (Mới bắt đầu)" },
      { value: "A2", label: "A2 (Sơ cấp)" },
      { value: "B1", label: "B1 (Trung cấp)" },
      { value: "B2", label: "B2 (Trung cao cấp)" },
      { value: "C1", label: "C1 (Cao cấp)" },
      { value: "C2", label: "C2 (Thành thạo)" },
    ],
  },
  "Tiếng Nhật": {
    framework: "JLPT",
    levels: [
      { value: "N5", label: "N5 (Mới bắt đầu)" },
      { value: "N4", label: "N4 (Sơ cấp)" },
      { value: "N3", label: "N3 (Trung cấp)" },
      { value: "N2", label: "N2 (Trung cao cấp)" },
      { value: "N1", label: "N1 (Cao cấp)" },
    ],
  },
  "Tiếng Trung": {
    framework: "HSK",
    levels: [
      { value: "HSK 1", label: "HSK 1 (Mới bắt đầu)" },
      { value: "HSK 2", label: "HSK 2 (Sơ cấp)" },
      { value: "HSK 3", label: "HSK 3 (Trung cấp)" },
      { value: "HSK 4", label: "HSK 4 (Trung cao cấp)" },
      { value: "HSK 5", label: "HSK 5 (Cao cấp)" },
      { value: "HSK 6", label: "HSK 6 (Thành thạo)" },
    ],
  },
  "Tiếng Hàn": {
    framework: "TOPIK",
    levels: [
      { value: "TOPIK 1", label: "TOPIK 1 (Sơ cấp 1)" },
      { value: "TOPIK 2", label: "TOPIK 2 (Sơ cấp 2)" },
      { value: "TOPIK 3", label: "TOPIK 3 (Trung cấp 3)" },
      { value: "TOPIK 4", label: "TOPIK 4 (Trung cấp 4)" },
      { value: "TOPIK 5", label: "TOPIK 5 (Cao cấp 5)" },
      { value: "TOPIK 6", label: "TOPIK 6 (Cao cấp 6)" },
    ],
  },
  "Tiếng Pháp": {
    framework: "CEFR",
    levels: [
      { value: "A1", label: "A1 (Débutant)" },
      { value: "A2", label: "A2 (Élémentaire)" },
      { value: "B1", label: "B1 (Intermédiaire)" },
      { value: "B2", label: "B2 (Intermédiaire supérieur)" },
      { value: "C1", label: "C1 (Avancé)" },
      { value: "C2", label: "C2 (Maîtrise)" },
    ],
  },
  "Tiếng Đức": {
    framework: "CEFR",
    levels: [
      { value: "A1", label: "A1 (Anfänger)" },
      { value: "A2", label: "A2 (Grundlegende Kenntnisse)" },
      { value: "B1", label: "B1 (Fortgeschrittene Sprachverwendung)" },
      { value: "B2", label: "B2 (Selbständige Sprachverwendung)" },
      { value: "C1", label: "C1 (Fachkundige Sprachkenntnisse)" },
      { value: "C2", label: "C2 (Annähernd muttersprachliche Kenntnisse)" },
    ],
  },
  "Tiếng Tây Ban Nha": {
    framework: "CEFR",
    levels: [
      { value: "A1", label: "A1 (Inicial)" },
      { value: "A2", label: "A2 (Elemental)" },
      { value: "B1", label: "B1 (Intermedio)" },
      { value: "B2", label: "B2 (Intermedio alto)" },
      { value: "C1", label: "C1 (Avanzado)" },
      { value: "C2", label: "C2 (Dominio)" },
    ],
  },
};

export function getLangCode(langName: string): string {
  const lower = (langName || "").toLowerCase();
  if (lower.includes("anh") || lower.includes("en")) return "en";
  if (lower.includes("nhật") || lower.includes("ja")) return "ja";
  if (lower.includes("trung") || lower.includes("zh")) return "zh";
  if (lower.includes("pháp") || lower.includes("fr")) return "fr";
  if (lower.includes("đức") || lower.includes("de")) return "de";
  if (lower.includes("tây ban nha") || lower.includes("es")) return "es";
  if (lower.includes("hàn") || lower.includes("ko")) return "ko";
  return "en";
}

export function getDisplayLanguageName(rawName?: string): string {
  if (!rawName) return "Tiếng Anh";
  const lower = rawName.toLowerCase();
  if (lower.includes("english") || lower === "eng" || lower === "en" || lower.includes("anh")) return "Tiếng Anh";
  if (lower.includes("japanese") || lower === "ja" || lower === "jpn" || lower.includes("nhật") || lower.includes("日本語")) return "Tiếng Nhật";
  if (lower.includes("chinese") || lower === "zh" || lower === "zho" || lower.includes("trung") || lower.includes("中文")) return "Tiếng Trung";
  if (lower.includes("korean") || lower === "ko" || lower === "kor" || lower.includes("hàn") || lower.includes("한국어")) return "Tiếng Hàn";
  if (lower.includes("french") || lower === "fr" || lower === "fra" || lower.includes("pháp") || lower.includes("français")) return "Tiếng Pháp";
  if (lower.includes("german") || lower === "de" || lower === "deu" || lower.includes("đức") || lower.includes("deutsch")) return "Tiếng Đức";
  if (lower.includes("spanish") || lower === "es" || lower === "esp" || lower.includes("tây ban nha") || lower.includes("español")) return "Tiếng Tây Ban Nha";
  if (lower.includes("vietnamese") || lower === "vi" || lower === "vie" || lower.includes("việt")) return "Tiếng Việt";
  return rawName;
}

export function matchLanguageToDb(
  selectedLang: string,
  dbLanguages: { id: number; code?: string; name?: string }[]
): { id: number; code?: string; name?: string } {
  const s = (selectedLang || "").toLowerCase();

  // 1. English
  if (s.includes("anh") || s.includes("eng") || s === "en") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "eng" || c === "en" || n.includes("english") || n.includes("anh");
    });
    if (found) return found;
  }

  // 2. Japanese
  if (s.includes("nhật") || s.includes("japan") || s === "ja") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "ja" || c === "jpn" || n.includes("japan") || n.includes("nhật") || n.includes("日本語");
    });
    if (found) return found;
  }

  // 3. Chinese
  if (s.includes("trung") || s.includes("chin") || s === "zh") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "zh" || c === "zho" || c === "chi" || n.includes("chin") || n.includes("trung") || n.includes("中文");
    });
    if (found) return found;
  }

  // 4. Korean
  if (s.includes("hàn") || s.includes("korean") || s === "ko") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "ko" || c === "kor" || n.includes("korean") || n.includes("hàn") || n.includes("한국어");
    });
    if (found) return found;
  }

  // 5. French
  if (s.includes("pháp") || s.includes("french") || s === "fr") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "fr" || c === "fra" || c === "fre" || n.includes("french") || n.includes("pháp") || n.includes("français");
    });
    if (found) return found;
  }

  // 6. German
  if (s.includes("đức") || s.includes("german") || s === "de") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "de" || c === "deu" || c === "ger" || n.includes("german") || n.includes("đức") || n.includes("deutsch");
    });
    if (found) return found;
  }

  // 7. Spanish
  if (s.includes("tây ban nha") || s.includes("spanish") || s === "es") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "es" || c === "esp" || c === "spa" || n.includes("spanish") || n.includes("tây ban nha") || n.includes("español");
    });
    if (found) return found;
  }

  // 8. Vietnamese
  if (s.includes("việt") || s.includes("viet") || s === "vi") {
    const found = dbLanguages.find((l) => {
      const c = (l.code || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      return c === "vi" || c === "vie" || n.includes("viet") || n.includes("việt");
    });
    if (found) return found;
  }

  // Fallback: search by inclusion or default to English (id: 2)
  const englishFallback = dbLanguages.find(
    (l) =>
      (l.code || "").toLowerCase() === "eng" ||
      (l.code || "").toLowerCase() === "en" ||
      (l.name || "").toLowerCase() === "english" ||
      l.id === 2
  );
  return englishFallback || dbLanguages[0] || { id: 2, name: "English", code: "eng" };
}

export const TOPIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  "Thời tiết": { en: "Weather", ja: "天気", zh: "天气", fr: "Météo", de: "Wetter", es: "Clima", ko: "날씨", vi: "Thời tiết" },
  "Kinh tế": { en: "Economy", ja: "経済", zh: "经济", fr: "Économie", de: "Wirtschaft", es: "Economía", ko: "경제", vi: "Kinh tế" },
  "Du lịch": { en: "Travel", ja: "旅行", zh: "旅游", fr: "Voyage", de: "Reise", es: "Viaje", ko: "여행", vi: "Du lịch" },
  "Công nghệ": { en: "Technology", ja: "技術", zh: "科技", fr: "Technologie", de: "Technologie", es: "Tecnología", ko: "기술", vi: "Công nghệ" },
  "Giao tiếp hàng ngày": { en: "Daily Conversation", ja: "日常会話", zh: "日常交流", fr: "Conversation quotidienne", de: "Alltägliche Konversation", es: "Conversación diaria", ko: "일상 대화", vi: "Giao tiếp hàng ngày" },
  "Công sở": { en: "Workplace", ja: "職場", zh: "职场", fr: "Milieu professionnel", de: "Arbeitsplatz", es: "Lugar de trabajo", ko: "직장", vi: "Công sở" },
  "Ẩm thực": { en: "Gastronomy", ja: "料理", zh: "美食", fr: "Gastronomie", de: "Gastronomie", es: "Gastronomía", ko: "음식", vi: "Ẩm thực" },
  "Phương tiện": { en: "Vehicles", ja: "乗り物", zh: "车辆", fr: "Véhicules", de: "Fahrzeuge", es: "Vehículos", ko: "교통수단", vi: "Phương tiện" },
  "Gia đình": { en: "Family", ja: "家族", zh: "家庭", fr: "Famille", de: "Familie", es: "Familia", ko: "가족", vi: "Gia đình" },
  "Mua sắm": { en: "Shopping", ja: "買い物", zh: "购物", fr: "Achats", de: "Einkaufen", es: "Compras", ko: "쇼핑", vi: "Mua sắm" },
  "Sức khỏe": { en: "Health", ja: "健康", zh: "健康", fr: "Santé", de: "Gesundheit", es: "Salud", ko: "건강", vi: "Sức khỏe" },
  "Giáo dục": { en: "Education", ja: "教育", zh: "教育", fr: "Éducation", de: "Bildung", es: "Educación", ko: "교육", vi: "Giáo dục" },
};

export async function translateTopicName(topic: string, languageName: string): Promise<string> {
  if (!topic) return "";
  const code = getLangCode(languageName);
  if (TOPIC_TRANSLATIONS[topic]?.[code]) {
    return TOPIC_TRANSLATIONS[topic][code];
  }
  try {
    const res = await api<{ translation: string }>("/translate", {
      method: "POST",
      body: { text: topic, target: code, source: "vi" },
    });
    if (res?.translation) {
      return res.translation;
    }
  } catch {
    // fallback
  }
  return topic;
}
