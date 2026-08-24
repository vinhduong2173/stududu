const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../../frontend/messages/en.json');
const viPath = path.join(__dirname, '../../frontend/messages/vi.json');
const frPath = path.join(__dirname, '../../frontend/messages/fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

const popupKeys = {
  en: {
    translation_label: "Translate:",
    definition_heading: "📝 Definition",
    example_heading: "💡 Example",
    no_info: "No information found for this word.",
    saved_by_users: "🌐 {count} people saved this",
    lookup_error: "Unable to look up word right now. Try again later.",
    saving_btn: "Saving...",
    save_to_notebook_btn: "Save to Notebook"
  },
  vi: {
    translation_label: "Dịch:",
    definition_heading: "📝 Định nghĩa",
    example_heading: "💡 Ví dụ",
    no_info: "Không tìm thấy thông tin cho từ này.",
    saved_by_users: "🌐 {count} người đã lưu",
    lookup_error: "Không thể tra từ lúc này. Thử lại sau.",
    saving_btn: "Đang lưu...",
    save_to_notebook_btn: "Lưu vào Sổ từ vựng"
  },
  fr: {
    translation_label: "Traduction :",
    definition_heading: "📝 Définition",
    example_heading: "💡 Exemple",
    no_info: "Aucune information trouvée pour ce mot.",
    saved_by_users: "🌐 {count} personnes ont enregistré",
    lookup_error: "Impossible de rechercher ce mot. Réessayez plus tard.",
    saving_btn: "Enregistrement...",
    save_to_notebook_btn: "Enregistrer dans le carnet"
  }
};

Object.assign(en.vocabulary, popupKeys.en);
Object.assign(vi.vocabulary, popupKeys.vi);
Object.assign(fr.vocabulary, popupKeys.fr);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');

console.log('Successfully added popup i18n keys to en, vi, fr!');
