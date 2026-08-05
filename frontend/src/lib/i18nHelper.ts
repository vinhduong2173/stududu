export const getTopicTranslation = (name: string, t: (key: string) => string): string => {
  if (!name) return "";
  const norm = name.trim().toLowerCase();

  // 1. Travel / Du lịch / Voyages / Viajes
  if (
    norm.includes("travel") ||
    norm.includes("du lịch") ||
    norm.includes("voyage") ||
    norm.includes("viaje")
  ) {
    return t("topics.travel");
  }

  // 2. Music / Âm nhạc / Musique / Música
  if (
    norm.includes("music") ||
    norm.includes("âm nhạc") ||
    norm.includes("musique") ||
    norm.includes("música")
  ) {
    return t("topics.music");
  }

  // 3. Movies / Phim ảnh / Films / Películas
  if (
    norm.includes("movie") ||
    norm.includes("phim") ||
    norm.includes("film") ||
    norm.includes("película")
  ) {
    return t("topics.movies");
  }

  // 4. Food / Ẩm thực / Gastronomie / Cocina / Comida
  if (
    norm.includes("food") ||
    norm.includes("ẩm thực") ||
    norm.includes("culinary") ||
    norm.includes("cuisine") ||
    norm.includes("gastronom") ||
    norm.includes("cocina") ||
    norm.includes("comida")
  ) {
    return t("topics.food");
  }

  // 5. Sports / Thể thao / Deportes / Fitness
  if (
    norm.includes("sport") ||
    norm.includes("thể thao") ||
    norm.includes("deporte") ||
    norm.includes("fitness")
  ) {
    return t("topics.sports");
  }

  // 6. Technology / Tech / Công nghệ / Technologie / Tecnología
  if (
    norm.includes("tech") ||
    norm.includes("công nghệ") ||
    norm.includes("technologie") ||
    norm.includes("tecnología")
  ) {
    return t("topics.tech");
  }

  // 7. Books / Sách / Livres / Libros / Reading / Lecture / Lectura
  if (
    norm.includes("book") ||
    norm.includes("sách") ||
    norm.includes("livre") ||
    norm.includes("libro") ||
    norm.includes("reading") ||
    norm.includes("lecture") ||
    norm.includes("lectura")
  ) {
    return t("topics.books");
  }

  // 8. Gaming / Game / Jeux vidéo / Videojuegos
  if (
    norm.includes("game") ||
    norm.includes("gaming") ||
    norm.includes("jeux") ||
    norm.includes("videojuego")
  ) {
    return t("topics.game");
  }

  // 9. Culture / Văn hóa / Cultura
  if (
    norm.includes("culture") ||
    norm.includes("văn hóa") ||
    norm.includes("cultura")
  ) {
    return t("topics.culture");
  }

  // 10. Exams / Thi cử / Examens / Exámenes
  if (
    norm.includes("exam") ||
    norm.includes("thi") ||
    norm.includes("ielts") ||
    norm.includes("toeic") ||
    norm.includes("delf") ||
    norm.includes("jlpt") ||
    norm.includes("exámenes")
  ) {
    return t("topics.exams");
  }

  return name;
};

export const getIntentTranslation = (intent: string | null | undefined, t: (key: string) => string): string => {
  if (!intent) return t("profile.not_specified");
  const norm = intent.trim().toLowerCase();

  if (norm.includes("casual") || norm.includes("giao tiếp") || norm.includes("informel") || norm.includes("informal")) {
    return t("onboarding.intent_casual");
  }
  if (norm.includes("exam") || norm.includes("thi") || norm.includes("examen") || norm.includes("ielts") || norm.includes("jlpt")) {
    return t("onboarding.intent_exam");
  }
  if (norm.includes("travel") || norm.includes("du lịch") || norm.includes("voyage") || norm.includes("viaje")) {
    return t("onboarding.intent_travel");
  }
  if (norm.includes("work") || norm.includes("làm việc") || norm.includes("travail") || norm.includes("trabajo") || norm.includes("affaires") || norm.includes("negocios")) {
    return t("onboarding.intent_work");
  }

  return intent;
};

export const getGenderTranslation = (gender: string | null | undefined, t: (key: string) => string): string => {
  if (!gender) return t("profile.not_specified");
  const norm = gender.trim().toLowerCase();

  if (norm === "nam" || norm === "male" || norm === "homme" || norm === "masculino") {
    return t("profile.gender_male") || "Nam";
  }
  if (norm === "nữ" || norm === "female" || norm === "femme" || norm === "femenino") {
    return t("profile.gender_female") || "Nữ";
  }
  if (norm === "khác" || norm.includes("custom") || norm.includes("other") || norm === "autre" || norm === "otro") {
    return t("profile.gender_other") || "Khác";
  }

  return gender;
};
