const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/messages/en.json'), 'utf8'));

// Build fr.json matching en.json structure exactly
const frDict = {
  // Common
  "Save": "Enregistrer",
  "Cancel": "Annuler",
  "Loading...": "Chargement...",
  "Retry": "Réessayer",
  "or": "ou",
  "Something went wrong. Please try again.": "Une erreur s'est produite. Veuillez réessayer.",
  "Languages": "Langues",
  "Interests": "Centres d'intérêt",
  "Completion": "Finalisation",
  "Please select at least 1 teachable language and 1 language to learn.": "Veuillez sélectionner au moins 1 langue maternelle et 1 langue à apprendre.",
  "Please write a personal bio.": "Veuillez rédiger une présentation personnelle.",
  "I speak (can teach)": "Je parle (langue maternelle / fluide)",
  "Select language": "Sélectionner une langue",
  "Add": "Ajouter",
  "I want to learn": "J'aimerais apprendre",
  "Saving...": "Enregistrement...",
  "Continue": "Continuer",
  "Your interests": "Vos centres d'intérêt",
  "Select topics that interest you (optional).": "Sélectionnez les sujets qui vous intéressent (optionnel).",
  "Back": "Retour",
  "Complete your profile": "Complétez votre profil",
  "A little bit about yourself will help you get matched easily.": "Quelques mots sur vous vous aideront à trouver des correspondances facilement.",
  "Personal introduction (Bio)": "Présentation personnelle (Bio)",
  "E.g. I am learning English for study abroad. I love coffee on weekends...": "Ex: J'apprends le français pour mes études...",
  "Primary learning intent": "Objectif principal d'apprentissage",
  "Finish & Discover": "Terminer & Découvrir",
  "Beginner": "Débutant (A1)",
  "Elementary": "Élémentaire (A2)",
  "Intermediate": "Intermédiaire (B1)",
  "Upper Intermediate": "Avancé (B2)",
  "Fluent": "Maîtrise (C1/C2)",
  "Casual conversation": "Discussion informelle",
  "Exam prep (IELTS, JLPT...)": "Préparation aux examens (DELF, IELTS...)",
  "Travel": "Voyages",
  "Work": "Travail / Affaires",
  "Music": "Musique",
  "Movies": "Films & Séries",
  "Food": "Gastronomie & Cuisine",
  "Sports": "Sports & Fitness",
  "Technology": "Technologie",
  "Books": "Livres & Lecture",
  "Gaming": "Jeux vidéo",
  "Culture": "Culture & Langues",
  "Exams (IELTS/TOEIC...)": "Examens (DELF, IELTS...)"
};

// Load our previous French dictionary if available
let previousFr = {};
try {
  previousFr = require('./gen_fr.js');
} catch(e) {}

function translateNode(enNode, frNodeSpec) {
  if (typeof enNode === 'string') {
    if (frNodeSpec && typeof frNodeSpec === 'string') return frNodeSpec;
    if (frDict[enNode]) return frDict[enNode];
    return enNode;
  }
  if (Array.isArray(enNode)) {
    return enNode.map((item, idx) => translateNode(item, frNodeSpec ? frNodeSpec[idx] : undefined));
  }
  if (typeof enNode === 'object' && enNode !== null) {
    const res = {};
    for (const key of Object.keys(enNode)) {
      const spec = frNodeSpec && frNodeSpec[key] !== undefined ? frNodeSpec[key] : undefined;
      res[key] = translateNode(enNode[key], spec);
    }
    return res;
  }
  return enNode;
}

const finalFr = translateNode(en, previousFr);

fs.writeFileSync(path.join(__dirname, '../../frontend/messages/fr.json'), JSON.stringify(finalFr, null, 2), 'utf8');
console.log('Cleanly generated fr.json with 100% key structure match!');
