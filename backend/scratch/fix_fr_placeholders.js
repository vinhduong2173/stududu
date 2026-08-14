const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '../../frontend/messages/fr.json');
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

fr.community.time_minutes_ago = "il y a {count} min";
fr.community.time_hours_ago = "il y a {count} h";
fr.community.post_word = "a contribué au mot \"{term}\" ({language}) dans la Bibliothèque Publique 🌐";
fr.community.post_milestone = "vient d'atteindre {hours} heures de pratique de conversation 🎉";
fr.community.reply_placeholder = "Répondre à {name}...";
fr.community.report_post_target = "la publication de {name}";

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('Successfully updated fr.json placeholder variables!');
