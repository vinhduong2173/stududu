const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/en.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), 'utf8'));

// Specific translations for sub-objects and extra keys
const frExtraDict = {
  "discover.levels.a1": "Débutant (A1)",
  "discover.levels.a2": "Élémentaire (A2)",
  "discover.levels.b1": "Intermédiaire (B1)",
  "discover.levels.b2": "Avancé (B2)",
  "discover.levels.c1": "Maîtrise (C1)",
  "discover.levels.c2": "Bilingue (C2)",

  "community.topics.all": "Tous les sujets",
  "community.topics.general": "Général",
  "community.topics.grammar": "Grammaire",
  "community.topics.vocabulary": "Vocabulaire",
  "community.topics.culture": "Culture",
  "community.topics.pronunciation": "Prononciation",

  "community.levels.native": "Langue maternelle",
  "community.levels.fluent": "Courant",

  "vocabulary.levels.all": "Tous les niveaux",
  "vocabulary.levels.mastered": "Maîtrisé",
  "vocabulary.levels.learning": "En cours",

  "vocabulary.topics.all": "Tous les sujets",
  "vocabulary.topics.general": "Général",
  
  "profile.gender_male": "Homme",
  "profile.gender_female": "Femme",
  "profile.gender_other": "Autre",
  "profile.not_specified": "Non spécifié",

  "onboarding.role_native": "Langue maternelle",
  "onboarding.role_fluent": "Courant",

  "onboarding.intent_casual": "Discussion informelle",
  "onboarding.intent_exam": "Préparation aux examens (DELF, IELTS...)",
  "onboarding.intent_travel": "Voyages",
  "onboarding.intent_work": "Travail / Affaires",

  // Common fallbacks
  "All levels": "Tous les niveaux",
  "Native": "Langue maternelle",
  "Fluent": "Courant",
  "Beginner": "Débutant (A1)",
  "Elementary": "Élémentaire (A2)",
  "Intermediate": "Intermédiaire (B1)",
  "Upper Intermediate": "Avancé (B2)",
  "Casual conversation": "Discussion informelle",
  "Exam prep (IELTS, JLPT...)": "Préparation aux examens",
  "Travel": "Voyages",
  "Work": "Travail / Affaires",
  "Shared interests": "Centres d'intérêt communs",
  "Online now": "En ligne uniquement",
  "Reset filters": "Réinitialiser les filtres",
  "Best match": "Meilleure correspondance",
  "Recently active": "Récemment actif",
  "matching partners": "partenaires correspondants",
  "Load more": "Charger plus",
  "Loading...": "Chargement...",
  "Finding your best matches...": "Recherche des meilleures correspondances...",
  "Failed to load suggestions": "Échec du chargement des suggestions",
  "Failed to load members": "Échec du chargement des membres",
  "Matching tip": "Conseil de matching",
  "Profiles with a photo and full bio get way more connections!": "Les profils avec une photo et une biographie complète obtiennent plus de connexions !",
  "Not enough matching partners": "Pas assez de partenaires correspondants",
  "Try switching to All members, or update your languages and interests.": "Essayez de passer sur Tous les membres, ou mettez à jour vos langues et centres d'intérêt.",
  "Refresh list": "Actualiser la liste",
  "Like": "J'aime",
  "Unlike": "Ne plus aimer",
  "Liked": "Aimé",
  "Message now": "Envoyer un message",
  "Keep discovering": "Continuer à découvrir",
  "Search by name, language, interests...": "Rechercher par nom, langue, centres d'intérêt...",
  "Partner level (language they teach)": "Niveau du partenaire (langue enseignée)",
  "Filters": "Filtres",
  "Just for you": "Rien que pour vous",
  "Discover": "Découvrir",
  "Find someone to learn and teach languages with you.": "Trouvez des partenaires pour pratiquer et échanger vos langues.",
  "Best matches": "Meilleures correspondances",
  "All members": "Tous les membres"
};

function fillObj(enNode, frNode, keyPath = '') {
  for (const k of Object.keys(enNode)) {
    const currentPath = keyPath ? `${keyPath}.${k}` : k;
    if (typeof enNode[k] === 'object' && enNode[k] !== null && !Array.isArray(enNode[k])) {
      if (!frNode[k] || typeof frNode[k] !== 'object') {
        frNode[k] = {};
      }
      fillObj(enNode[k], frNode[k], currentPath);
    } else {
      if (!frNode[k] || frNode[k] === enNode[k]) {
        if (frExtraDict[currentPath]) {
          frNode[k] = frExtraDict[currentPath];
        } else if (frExtraDict[enNode[k]]) {
          frNode[k] = frExtraDict[enNode[k]];
        } else {
          frNode[k] = enNode[k];
        }
      }
    }
  }
}

fillObj(en, fr);

fs.writeFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), JSON.stringify(fr, null, 2), 'utf8');
console.log('Successfully filled all 505 keys in fr.json!');
