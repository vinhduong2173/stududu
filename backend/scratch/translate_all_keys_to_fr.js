const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '../../frontend/messages/fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Complete French translations map for all components
const frMap = {
  // Community
  "community.event1_btn": "S'inscrire",
  "community.event2_time": "20:00 - Chaque mercredi",
  "community.event2_title": "🌸 Challenge Vocabulaire N3 & Kanji Kaiwa",
  "community.event2_desc": "20 questions rapides de Kanji associant les étudiants à des locuteurs natifs.",
  "community.event2_btn": "Intéressé(e)",
  "community.event_toast_notice": "ℹ️ La fonctionnalité d'inscription aux événements arrive bientôt !",
  "community.prev_word": "Mot précédent",
  "community.translate_post": "Traduire la publication",
  "community.see_translation": "Voir la traduction",
  "community.translated": "Traduit",
  "community.translation_title": "Traduction automatique",
  "community.hide_translation": "Masquer la traduction",

  // Vocabulary
  "vocabulary.tab_mine": "Mon carnet",
  "vocabulary.tab_library": "Bibliothèque publique",
  "vocabulary.search_mine_placeholder": "Rechercher des mots, des notes...",
  "vocabulary.search_library_placeholder": "Rechercher dans la bibliothèque publique...",
  "vocabulary.add_word": "Ajouter un mot",
  "vocabulary.library_hint": "Les mots enregistrés par au moins 3 membres intègrent automatiquement la bibliothèque publique.",
  "vocabulary.source_chat": "Depuis le chat",
  "vocabulary.source_manual": "Manuel",
  "vocabulary.in_library": "Dans la bibliothèque publique",
  "vocabulary.no_definition": "Pas encore de définition ou de note",
  "vocabulary.deleted_toast": "Mot supprimé de votre carnet",
  "vocabulary.personal_note_label": "Note personnelle",
  "vocabulary.saved_by_count": "{count} personnes ont enregistré ce mot",
  "vocabulary.empty_title": "Carnet de vocabulaire vide",
  "vocabulary.empty_no_match": "Aucun mot trouvé",
  "vocabulary.empty_no_match_hint": "Essayez de rechercher avec un mot-clé différent.",
  "vocabulary.add_first_word": "Ajoutez votre premier mot",
  "vocabulary.contrib_title": "Contribuer pour \"{term}\"",
  "vocabulary.contrib_success": "🙌 Merci pour votre contribution !",
  "vocabulary.contrib_btn": "Contribuer",
  "vocabulary.need_definition": "⏳ Définition requise",
  "vocabulary.save_count_label": "{count} enregistrements",
  "vocabulary.save_success": "✅ \"{term}\" enregistré",
  "vocabulary.save_exists": "\"{term}\" est déjà dans votre carnet",
  "vocabulary.language_label": "Langue",
  "vocabulary.quiz_hint_prompt": "Choisissez la traduction la plus précise ci-dessous :",

  // Profile
  "profile.title_me": "Mon profil",
  "profile.settings": "Paramètres",
  "profile.tab_posts": "Publications",
  "profile.tab_about": "À propos",
  "profile.posts_title": "Publications",
  "profile.posts_count": "{count} publications",
  "profile.no_posts_me": "Vous n'avez encore rien publié.",
  "profile.create_post_hint": "Partagez une publication avec la communauté !",
  "profile.create_post_btn": "Créer une publication",
  "profile.post_placeholder": "Quoi de neuf, {name} ?",
  "profile.lives_in": "Habite à",
  "profile.gender_label": "Genre",
  "profile.timezone_label_short": "Fuseau horaire",
  "profile.speaks_label": "Parle",
  "profile.learns_label": "Apprend",
  "profile.level_label": "Niveau",
  "profile.edit_btn": "Modifier",
  "profile.completion": "Complétion du profil",
  "profile.trust_activity": "Confiance & Activité",
  "profile.languages": "Langues",
  "profile.can_teach": "Peut enseigner",
  "profile.want_learn": "Souhaite apprendre",
  "profile.none": "Aucun",
  "profile.intro": "À propos de moi",
  "profile.no_intro_me": "Vous n'avez pas encore rédigé de présentation — ajoutez quelques lignes pour trouver facilement des correspondances.",
  "profile.no_intro_other": "Ce membre n'a pas encore rédigé de présentation.",
  "profile.intent": "Objectif",
  "profile.availability": "Disponibilités & Fuseau horaire",
  "profile.no_availability": "Disponibilités non définies",
  "profile.interests": "Centres d'intérêt",
  "profile.no_interests": "Aucun centre d'intérêt choisi",
  "profile.loading_error": "Échec du chargement du profil",
  "profile.hint_avatar": "Ajouter une photo de profil",
  "profile.hint_bio": "Rédiger une présentation personnelle",
  "profile.hint_teach": "Ajouter la langue que vous pouvez enseigner",
  "profile.hint_learn": "Ajouter la langue que vous souhaitez apprendre",
  "profile.hint_interests": "Choisir des centres d'intérêt",
  "profile.hint_intent": "Choisir l'objectif d'apprentissage",
  "profile.report": "Signaler",
  "profile.block": "Bloquer",
  "profile.endorse_btn": "Féliciter",
  "profile.endorse_success_toast": "🏅 Félicitation envoyée. Merci !",
  "profile.no_endorsements": "Pas encore de félicitations",
  "profile.chat_hours": "{count} heures de pratique",
  "profile.conversations": "{count} conversations",
  "profile.endorse_title": "Féliciter {name}",
  "profile.endorse_desc": "Choisissez ce que vous souhaitez reconnaître après avoir échangé avec {name} — pas de note, juste une appréciation qualitative.",
  "profile.endorse_already_given": "✓ Déjà félicité(e)",
  "profile.sending": "Envoi en cours...",
  "profile.submit_endorse": "Envoyer la félicitation",
  "profile.lang_proficiency": "Maîtrise de la langue",
  "profile.social_knowledge": "Culture & Connaissances sociales",
  "profile.niche_expertise": "Expertise approfondie",
  "profile.friendliness": "Amical(e) & Sympathique",
  "profile.trust_activity_other": "Reconnaissances de la communauté",
  "profile.report_success_toast": "Signalement envoyé. Merci !",
  "profile.block_success_toast": "Bloqué(e) {name}",
  "profile.like_success_toast": "💜 Aimé(e) {name} — démarrez une conversation !",
  "profile.loading_error_other": "Échec du chargement du profil",
  "profile.user_not_found": "Utilisateur introuvable",
  "profile.message_btn": "Message",
  "profile.basic_info": "Informations de base",
  "profile.avatar": "Photo de profil",
  "profile.select_image": "Sélectionner une photo",
  "profile.delete_image": "Supprimer la photo",
  "profile.avatar_hint": "JPG/PNG — l'image sera compressée automatiquement.",
  "profile.avatar_error": "Impossible de lire cette photo, essayez-en une autre.",
  "profile.dob": "Date de naissance",
  "profile.gender": "Genre",
  "profile.gender_private": "Ne pas divulguer",
  "profile.city": "Ville",
  "profile.city_placeholder": "Ex: Paris",
  "profile.display_name": "Nom d'affichage",

  // Chat & Nav
  "chat.photo": "📷 Photo",
  "chat.title": "Messages",
  "notifications.title": "Notifications",
  "discover.card_native": "Langue maternelle",
  "discover.card_fluent": "Courant",
  "onboarding.role_native": "Langue maternelle",
  "onboarding.role_fluent": "Courant"
};

function applyTranslations(obj, prefix = '') {
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      applyTranslations(obj[k], p);
    } else {
      if (frMap[p]) {
        obj[k] = frMap[p];
      }
    }
  }
}

applyTranslations(fr);

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('Successfully updated all French keys in fr.json!');
